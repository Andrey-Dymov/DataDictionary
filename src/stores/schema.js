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
    async loadDictionaries() {
      console.log('[Store] Loading dictionaries')
      const dictionaryStore = useDictionaryStore()
      await dictionaryStore.loadDictionariesMeta()
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

    setSelectedEntity(name) {
      console.log('[SchemaStore] Setting selected entity:', name)
      this.selectedEntityName = name
      
      const dictionaryStore = useDictionaryStore()
      const currentDictionaryId = dictionaryStore.currentDictionaryId
      
      if (currentDictionaryId) {
        const savedSelections = JSON.parse(localStorage.getItem('selectedEntities') || '{}')
        savedSelections[currentDictionaryId] = name
        localStorage.setItem('selectedEntities', JSON.stringify(savedSelections))
      }
    },

    async updateCollection(name, data) {
      console.log('[Store] Updating collection:', name)
      try {
        // Используем новый метод update для обновления сущности
        await dictionaryService.update('entity', name, data)
        const index = this.entities.findIndex(c => c.name === name)
        if (index !== -1) {
          this.entities[index] = data
        }
      } catch (error) {
        console.error('[Store] Error updating collection:', error)
        throw error
      }
    },

    async addCollection(data) {
      console.log('[Store] Adding collection:', data.name)
      try {
        const dictionaryStore = useDictionaryStore()
        // Используем новый метод create для создания сущности
        await dictionaryService.create('entity', data, dictionaryStore.currentDictionaryId)
        this.entities.push(data)
      } catch (error) {
        console.error('[Store] Error adding collection:', error)
        throw error
      }
    },

    async deleteCollection(name) {
      console.log('[Store] Deleting collection:', name)
      try {
        // Используем новый метод delete для удаления сущности
        await dictionaryService.delete('entity', name)
        this.entities = this.entities.filter(c => c.name !== name)
      } catch (error) {
        console.error('[Store] Error deleting collection:', error)
        throw error
      }
    },

    // Новые методы для работы с полями
    async addField(entityName, fieldData) {
      console.log('[Store] Adding field to entity:', entityName)
      try {
        await dictionaryService.create('field', fieldData, entityName)
        const entity = this.getEntityByName(entityName)
        if (entity) {
          entity.fields = entity.fields || []
          entity.fields.push(fieldData)
        }
      } catch (error) {
        console.error('[Store] Error adding field:', error)
        throw error
      }
    },

    async updateField(entityName, fieldName, fieldData) {
      console.log('[SchemaStore] Updating field:', fieldName, 'in entity:', entityName)
      try {
        // Сначала обновляем на сервере
        await dictionaryService.update('field', fieldName, fieldData, entityName)
        
        // После успешного обновления на сервере обновляем локальное состояние
        const entity = this.getEntityByName(entityName)
        if (entity) {
          const fieldIndex = entity.fields.findIndex(f => f.name === fieldName)
          if (fieldIndex !== -1) {
            console.log('[SchemaStore] Updating local field data:', fieldData)
            entity.fields[fieldIndex] = fieldData
          }
        }

        // Перезагружаем данные словаря
        const dictionaryStore = useDictionaryStore()
        console.log('[SchemaStore] Reloading dictionary data')
        await this.loadSchema(dictionaryStore.currentDictionaryId)
        console.log('[SchemaStore] Dictionary data reloaded')

      } catch (error) {
        console.error('[SchemaStore] Error updating field:', error)
        throw error
      }
    },

    async deleteField(entityName, fieldName) {
      console.log('[Store] Deleting field:', fieldName, 'from entity:', entityName)
      try {
        await dictionaryService.delete('field', fieldName, entityName)
        const entity = this.getEntityByName(entityName)
        if (entity) {
          entity.fields = entity.fields.filter(f => f.name !== fieldName)
        }
      } catch (error) {
        console.error('[Store] Error deleting field:', error)
        throw error
      }
    },

    // Новые методы для работы со связями
    async addRelation(entityName, relationName, relationData) {
      console.log('[Store] Adding relation to entity:', entityName)
      try {
        await dictionaryService.create('relation', { name: relationName, ...relationData }, entityName)
        const entity = this.getEntityByName(entityName)
        if (entity) {
          entity.relations = entity.relations || {}
          entity.relations[relationName] = relationData
        }
      } catch (error) {
        console.error('[Store] Error adding relation:', error)
        throw error
      }
    },

    async updateRelation(entityName, relationName, relationData) {
      console.log('[Store] Updating relation:', relationName, 'in entity:', entityName)
      try {
        await dictionaryService.update('relation', relationName, relationData, entityName)
        const entity = this.getEntityByName(entityName)
        if (entity && entity.relations) {
          entity.relations[relationName] = relationData
        }
      } catch (error) {
        console.error('[Store] Error updating relation:', error)
        throw error
      }
    },

    async deleteRelation(entityName, relationName) {
      console.log('[Store] Deleting relation:', relationName, 'from entity:', entityName)
      try {
        await dictionaryService.delete('relation', relationName, entityName)
        const entity = this.getEntityByName(entityName)
        if (entity && entity.relations) {
          delete entity.relations[relationName]
        }
      } catch (error) {
        console.error('[Store] Error deleting relation:', error)
        throw error
      }
    }
  }
})
