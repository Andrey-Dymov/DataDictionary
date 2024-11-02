import { defineStore } from 'pinia'
import dictionaryService from '../services/dictionaryService'
import { useDictionaryStore } from './dictionary'

export const useSchemaStore = defineStore('schema', {
  state: () => ({
    entities: [],
    selectedEntityName: '',
    isLoading: false,
    isLoaded: false,
    error: null
  }),

  getters: {
    getEntityByName: (state) => (name) => {
      console.log('[SchemaStore] Getting entity by name:', name)
      console.log('[SchemaStore] Current entities:', state.entities)
      if (!state.entities) {
        console.log('[SchemaStore] No entities array')
        return null
      }
      const entity = state.entities.find(e => e.name === name)
      console.log('[SchemaStore] Found entity:', entity)
      return entity
    }
  },

  actions: {
    calculateRelationsForEntity(entityName) {
      const entity = this.getEntityByName(entityName)
      if (!entity?.fields) return {}

      const relations = {}
      
      // Добавляем связи от reference полей
      entity.fields
        .filter(field => field.parent && field.type === 'reference')
        .forEach(field => {
          const baseName = field.name.endsWith('Id') ? field.name.slice(0, -2) : field.name
          const relationName = baseName
          
          relations[relationName] = {
            type: 'belongsTo',
            target: field.parent,
            foreignKey: field.name,
            restriction: field.restriction || 'restrict'
          }
        })

      // Добавляем связи от references полей
      entity.fields
        .filter(field => field.parent && field.type === 'references')
        .forEach(field => {
          const baseName = field.name.endsWith('Ids') ? field.name.slice(0, -3) : field.name
          const relationName = baseName.charAt(0).toLowerCase() + baseName.slice(1) + 's'
          
          relations[relationName] = {
            type: 'belongsToMany',
            target: field.parent,
            foreignKey: field.name,
            restriction: field.restriction || 'restrict'
          }
        })

      // Добавляем обратные связи
      this.entities.forEach(childEntity => {
        if (childEntity.name === entityName) return

        childEntity.fields
          .filter(field => field.parent === entityName && field.type === 'reference')
          .forEach(field => {
            let relationName = childEntity.name
            
            if (relations[relationName]) {
              const fieldBaseName = field.name.endsWith('Id') ? 
                field.name.slice(0, -2) : field.name
              relationName = `${childEntity.name}${fieldBaseName.charAt(0).toUpperCase()}${fieldBaseName.slice(1)}`
            }

            relations[relationName] = {
              type: 'hasMany',
              target: childEntity.name,
              foreignKey: field.name,
              restriction: field.restriction || 'restrict'
            }
          })
      })

      return relations
    },

    compareRelations(oldRelations, newRelations, $q) {
        console.log('[SchemaStore] ====== Comparing relations ======')
        console.log('[SchemaStore] Old relations:', oldRelations)
        console.log('[SchemaStore] New relations:', newRelations)

        const changes = {
            delete: [],
            update: [],
            create: []
        }

        // 1. Сначала находим все старые связи, которых нет в новых
        // или которые изменились по содержимому
        for (const [oldName, oldData] of Object.entries(oldRelations)) {
            const newData = newRelations[oldName]
            
            if (!newData) {
                // Если с��язи с таким именем больше нет
                console.log(`[SchemaStore] Relation "${oldName}" will be deleted`)
                
                // Получаем базовое имя связи (без Id)
                const baseName = oldName.endsWith('Id') ? oldName.slice(0, -2) : oldName
                
                // Ищем похожую связь с другим именем
                const similarNew = Object.entries(newRelations).find(([newName, newData]) => 
                    newData.type === oldData.type &&
                    newData.target === oldData.target &&
                    newData.foreignKey !== oldData.foreignKey // Разные foreignKey означают переименование поля
                )

                changes.delete.push({ relationName: oldName })

                if (similarNew) {
                    // Если нашли похожую связь с другим именем - это переименование
                    console.log(`[SchemaStore] Found renamed relation: "${oldName}" -> "${similarNew[0]}"`)
                    changes.create.push({
                        relationName: similarNew[0],
                        data: similarNew[1]
                    })
                    if ($q) {
                        $q.notify({
                            type: 'info',
                            message: `Связь "${oldName}" будет переименована в "${similarNew[0]}"`
                        })
                    }
                } else {
                    if ($q) {
                        $q.notify({
                            type: 'warning',
                            message: `Связь "${oldName}" будет удалена`
                        })
                    }
                }
            } else {
                // Если связь с таким именем есть, проверяем изменения
                const isDifferent = 
                    oldData.type !== newData.type ||
                    oldData.target !== newData.target ||
                    oldData.foreignKey !== newData.foreignKey ||
                    oldData.restriction !== newData.restriction

                if (isDifferent) {
                    console.log(`[SchemaStore] Relation "${oldName}" changed:`, {
                        old: oldData,
                        new: newData
                    })
                    changes.update.push({
                        relationName: oldName,
                        data: newData
                    })
                    if ($q) {
                        $q.notify({
                            type: 'info',
                            message: `Связь "${oldName}" будет обновлена`
                        })
                    }
                }
            }
        }

        // 2. Находим новые связи, которых не было в старых
        for (const [newName, newData] of Object.entries(newRelations)) {
            if (!oldRelations[newName] && 
                !changes.create.some(c => c.relationName === newName)) {
                console.log(`[SchemaStore] New relation "${newName}" will be created`)
                changes.create.push({
                    relationName: newName,
                    data: newData
                })
                if ($q) {
                    $q.notify({
                        type: 'positive',
                        message: `Будет создана новая связь "${newName}"`
                    })
                }
            }
        }

        return changes
    },

    async updateField(entityName, fieldName, fieldData, $q) {
        try {
            const entity = this.getEntityByName(entityName)
            const oldField = entity.fields.find(f => f.name === fieldName)
            
            // 1. Сначала обновляем поле
            await dictionaryService.update('field', fieldName, fieldData, entityName)
            if ($q) {
                $q.notify({
                    type: 'positive',
                    message: `Поле "${oldField.name}" переименовано в "${fieldData.name}"`
                })
            }

            // 2. Если это reference/references поле и изменился родитель
            if (['reference', 'references'].includes(fieldData.type) && 
                (oldField.parent !== fieldData.parent || oldField.name !== fieldData.name)) {

                // 2.1. Получаем имена связей
                const oldRelationName = oldField.name.endsWith('Id') ? 
                    oldField.name.slice(0, -2) : oldField.name
                const newRelationName = fieldData.name.endsWith('Id') ? 
                    fieldData.name.slice(0, -2) : fieldData.name

                // 2.2. Удаляем старую связь в текущей сущности
                await dictionaryService.delete('relation', entityName, oldRelationName)
                if ($q) {
                    $q.notify({
                        type: 'warning',
                        message: `Удалена связь "${oldRelationName}" в сущности "${entity.prompt || entity.name}"`
                    })
                }

                // 2.3. Создаем новую связь в текущей сущности
                const relationData = {
                    name: newRelationName,
                    type: 'belongsTo',
                    target: fieldData.parent,
                    foreignKey: fieldData.name,
                    restriction: fieldData.restriction || 'restrict'
                }
                await dictionaryService.create('relation', entityName, relationData)
                if ($q) {
                    $q.notify({
                        type: 'positive',
                        message: `Создана связь "${newRelationName}" в сущности "${entity.prompt || entity.name}"`
                    })
                }

                // 2.4. Обновляем связи в родительских сущностях
                if (oldField.parent) {
                    const oldParentEntity = this.getEntityByName(oldField.parent)
                    const oldParentRelationName = `${entityName}${oldField.name.charAt(0).toUpperCase()}${oldField.name.slice(1)}`
                    await dictionaryService.delete('relation', oldField.parent, oldParentRelationName)
                    if ($q) {
                        $q.notify({
                            type: 'warning',
                            message: `Удалена связь "${oldParentRelationName}" в родительской сущности "${oldParentEntity.prompt || oldParentEntity.name}"`
                        })
                    }
                }

                if (fieldData.parent) {
                    const newParentEntity = this.getEntityByName(fieldData.parent)
                    const newParentRelationName = `${entityName}${fieldData.name.charAt(0).toUpperCase()}${fieldData.name.slice(1)}`
                    const parentRelationData = {
                        name: newParentRelationName,
                        type: 'hasMany',
                        target: entityName,
                        foreignKey: fieldData.name,
                        restriction: fieldData.restriction || 'restrict'
                    }
                    await dictionaryService.create('relation', fieldData.parent, parentRelationData)
                    if ($q) {
                        $q.notify({
                            type: 'positive',
                            message: `Создана связь "${newParentRelationName}" в родительской сущности "${newParentEntity.prompt || newParentEntity.name}"`
                        })
                    }
                }
            }

            // 3. Перезагружаем схему
            const dictionaryStore = useDictionaryStore()
            await this.loadSchema(dictionaryStore.currentDictionaryId)

        } catch (error) {
            console.error('[SchemaStore] Error updating field:', error)
            if ($q) {
                $q.notify({
                    type: 'negative',
                    message: `Ошибка при обновлении поля "${fieldData.prompt || fieldData.name}"`
                })
            }
            throw error
        }
    },

    async loadSchema(dictionaryId) {
        console.log('[SchemaStore] Starting loadSchema for dictionary:', dictionaryId)
        this.isLoading = true
        try {
            console.log('[SchemaStore] Requesting dictionary data...')
            const data = await dictionaryService.getOne('dictionary', dictionaryId)
            console.log('[SchemaStore] Received dictionary data:', data)
            
            // Используем entities из данных
            this.entities = data.entities || []
            console.log('[SchemaStore] Set entities:', this.entities)
            
            this.isLoaded = true

            // Восстанавливаем сохраненную сущность
            const savedSelections = JSON.parse(localStorage.getItem('selectedEntities') || '{}')
            const savedEntity = savedSelections[dictionaryId]
            console.log('[SchemaStore] Saved entity for dictionary:', savedEntity)
            
            if (savedEntity && this.entities.find(e => e.name === savedEntity)) {
                console.log('[SchemaStore] Restoring saved entity:', savedEntity)
                this.selectedEntityName = savedEntity
            } else if (this.entities.length > 0) {
                console.log('[SchemaStore] Using first entity:', this.entities[0].name)
                this.selectedEntityName = this.entities[0].name
            } else {
                console.log('[SchemaStore] No entities available')
                this.selectedEntityName = ''
            }
            console.log('[SchemaStore] Selected entity name:', this.selectedEntityName)
        } catch (error) {
            console.error('[SchemaStore] Error loading schema:', error)
            this.error = error.message
            throw error
        } finally {
            this.isLoading = false
        }
    },

    async updateCollection(name, data, $q) {
        console.log('[SchemaStore] Updating collection:', name, data)
        try {
            await dictionaryService.update('entity', name, data)
            
            // Обновляем сущность в локальном состоянии
            const index = this.entities.findIndex(c => c.name === name)
            if (index !== -1) {
                this.entities[index] = data
            }

            if ($q) {
                $q.notify({
                    type: 'positive',
                    message: `Сущность "${data.prompt || data.name}" бновлена`
                })
            }
        } catch (error) {
            console.error('[SchemaStore] Error updating collection:', error)
            if ($q) {
                $q.notify({
                    type: 'negative',
                    message: `Ошибка при обновлении сущности "${data.prompt || data.name}"`
                })
            }
            throw error
        }
    },

    setSelectedEntity(name) {
        console.log('[SchemaStore] Setting selected entity:', name)
        this.selectedEntityName = name
        
        // Сохраняем выбор в localStorage
        const dictionaryStore = useDictionaryStore()
        const currentDictionaryId = dictionaryStore.currentDictionaryId
        
        if (currentDictionaryId) {
            const savedSelections = JSON.parse(localStorage.getItem('selectedEntities') || '{}')
            savedSelections[currentDictionaryId] = name
            localStorage.setItem('selectedEntities', JSON.stringify(savedSelections))
            console.log('[SchemaStore] Saved selection to localStorage:', { dictionaryId: currentDictionaryId, entityName: name })
        }
    },

    async addRelation(entityName, relationData, $q) {
      try {
        console.log('[SchemaStore] Adding relation:', relationData)
        await dictionaryService.create('relation', entityName, relationData)
        const entity = this.getEntityByName(entityName)
        if (entity) {
          entity.relations = entity.relations || {}
          entity.relations[relationData.name] = relationData
        }
        if ($q) {
          $q.notify({
            type: 'positive',
            message: `Связь "${relationData.name}" добавлена`
          })
        }
      } catch (error) {
        console.error('[SchemaStore] Error adding relation:', error)
        if ($q) {
          $q.notify({
            type: 'negative',
            message: `Ошибка при добавлении связи "${relationData.name}"`
          })
        }
        throw error
      }
    },

    async updateRelation(entityName, relationName, relationData, $q) {
      try {
        console.log('[SchemaStore] Updating relation:', relationData)
        await dictionaryService.update('relation', entityName, relationName, relationData)
        const entity = this.getEntityByName(entityName)
        if (entity && entity.relations) {
          entity.relations[relationName] = relationData
        }
        if ($q) {
          $q.notify({
            type: 'positive',
            message: `Связь "${relationName}" обновлена`
          })
        }
      } catch (error) {
        console.error('[SchemaStore] Error updating relation:', error)
        if ($q) {
          $q.notify({
            type: 'negative',
            message: `Ошибка при обновлении связи "${relationName}"`
          })
        }
        throw error
      }
    },

    async deleteRelation(entityName, relationName, $q) {
      try {
        console.log('[SchemaStore] Deleting relation:', relationName)
        await dictionaryService.delete('relation', entityName, relationName)
        const entity = this.getEntityByName(entityName)
        if (entity && entity.relations) {
          delete entity.relations[relationName]
        }
        if ($q) {
          $q.notify({
            type: 'positive',
            message: `Связь "${relationName}" удалена`
          })
        }
      } catch (error) {
        console.error('[SchemaStore] Error deleting relation:', error)
        if ($q) {
          $q.notify({
            type: 'negative',
            message: `Ошибка при удалении связи "${relationName}"`
          })
        }
        throw error
      }
    }
  }
})
