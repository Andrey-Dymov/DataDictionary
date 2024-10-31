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
          const relationName = baseName.charAt(0).toLowerCase() + baseName.slice(1)
          
          relations[relationName] = {
            type: 'belongsTo',
            target: field.parent,
            foreignKey: field.name,
            restriction: 'restrict'
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
            restriction: 'restrict'
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
              restriction: 'restrict'
            }
          })
      })

      return relations
    },

    compareRelations(oldRelations, newRelations) {
      const changes = {
        delete: [],
        update: [],
        create: []
      }

      // Находим удаленные и измененные связи
      for (const [name, oldData] of Object.entries(oldRelations)) {
        if (!newRelations[name]) {
          changes.delete.push({ relationName: name })
        } else if (JSON.stringify(oldData) !== JSON.stringify(newRelations[name])) {
          changes.update.push({ 
            relationName: name, 
            data: newRelations[name] 
          })
        }
      }

      // Находим новые связи
      for (const [name, newData] of Object.entries(newRelations)) {
        if (!oldRelations[name]) {
          changes.create.push({ 
            relationName: name, 
            data: newData 
          })
        }
      }

      return changes
    },

    async updateField(entityName, fieldName, fieldData, $q) {
      try {
        const entity = this.getEntityByName(entityName)
        const oldField = entity.fields.find(f => f.name === fieldName)
        
        // 1. Определяем затронутые сущности
        const affectedEntities = new Set([entityName])
        
        if (oldField?.parent) {
          affectedEntities.add(oldField.parent)
        }
        
        if (fieldData.parent) {
          affectedEntities.add(fieldData.parent)
        }

        // 2. Сохраняем поле
        const fieldToSave = {
          name: fieldData.name,
          type: fieldData.type,
          list: fieldData.list,
          input: fieldData.input,
          prompt: fieldData.prompt || undefined,
          req: fieldData.req || undefined,
          parent: fieldData.parent || undefined
        }

        Object.keys(fieldToSave).forEach(key => {
          if (fieldToSave[key] === undefined) {
            delete fieldToSave[key]
          }
        })

        console.log('[SchemaStore] Saving field:', fieldToSave)
        await dictionaryService.update('field', fieldName, fieldToSave, entityName)
        if ($q) {
          $q.notify({
            type: 'positive',
            message: `Поле "${fieldToSave.prompt || fieldToSave.name}" обновлено`
          })
        }

        // 3. Для каждой затронутой сущности обновляем связи
        for (const affectedEntityName of affectedEntities) {
          const affectedEntity = this.getEntityByName(affectedEntityName)
          
          // Вычисляем новые связи
          const newRelations = this.calculateRelationsForEntity(affectedEntityName)
          
          // Обновляем сущность целиком с новыми связями
          const updatedEntity = {
            ...affectedEntity,
            relations: newRelations
          }

          await this.updateCollection(affectedEntityName, updatedEntity, $q)
          if ($q) {
            $q.notify({
              type: 'positive',
              message: `Связи сущности "${affectedEntity.prompt || affectedEntity.name}" обновлены`
            })
          }
        }

        // Перезагружаем данные словаря
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
                    message: `Сущность "${data.prompt || data.name}" обновлена`
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
    }
  }
})
