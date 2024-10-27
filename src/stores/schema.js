import { defineStore } from 'pinia'
import schemaService from '../services/schemaService'
import { useDictionaryStore } from './dictionary'

export const useSchemaStore = defineStore('schema', {
  state: () => ({
    collections: [],
    selectedCollectionName: '',
    isLoading: false,
    isLoaded: false,
    error: null
  }),

  getters: {
    getCollectionByName: (state) => (name) => {
      return state.collections.find(c => c.name === name)
    }
  },

  actions: {
    async loadDictionaries() {
      console.log('[Store] Loading dictionaries')
      const dictionaryStore = useDictionaryStore()
      await dictionaryStore.loadDictionariesMeta()
    },

    async loadSchema(dictionaryId) {
      console.log('[Store] Loading schema for dictionary:', dictionaryId)
      this.isLoading = true
      try {
        // Используем новый метод getOne для получения словаря
        const data = await schemaService.getOne('dictionary', dictionaryId)
        this.collections = data.collections
        this.isLoaded = true

        // Восстанавливаем сохраненную сущность
        const savedSelections = JSON.parse(localStorage.getItem('selectedCollections') || '{}')
        const savedCollection = savedSelections[dictionaryId]
        
        if (savedCollection && this.collections.find(c => c.name === savedCollection)) {
          this.selectedCollectionName = savedCollection
        } else if (this.collections.length > 0) {
          this.selectedCollectionName = this.collections[0].name
        }
      } catch (error) {
        console.error('[Store] Error loading schema:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    setSelectedCollection(name) {
      console.log('[Store] Setting selected collection:', name)
      this.selectedCollectionName = name
      
      const dictionaryStore = useDictionaryStore()
      const currentDictionaryId = dictionaryStore.currentDictionaryId
      
      if (currentDictionaryId) {
        const savedSelections = JSON.parse(localStorage.getItem('selectedCollections') || '{}')
        savedSelections[currentDictionaryId] = name
        localStorage.setItem('selectedCollections', JSON.stringify(savedSelections))
      }
    },

    async updateCollection(name, data) {
      console.log('[Store] Updating collection:', name)
      try {
        // Используем новый метод update для обновления сущности
        await schemaService.update('entity', name, data)
        const index = this.collections.findIndex(c => c.name === name)
        if (index !== -1) {
          this.collections[index] = data
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
        await schemaService.create('entity', data, dictionaryStore.currentDictionaryId)
        this.collections.push(data)
      } catch (error) {
        console.error('[Store] Error adding collection:', error)
        throw error
      }
    },

    async deleteCollection(name) {
      console.log('[Store] Deleting collection:', name)
      try {
        // Используем новый метод delete для удаления сущности
        await schemaService.delete('entity', name)
        this.collections = this.collections.filter(c => c.name !== name)
      } catch (error) {
        console.error('[Store] Error deleting collection:', error)
        throw error
      }
    },

    // Новые методы для работы с полями
    async addField(entityName, fieldData) {
      console.log('[Store] Adding field to entity:', entityName)
      try {
        await schemaService.create('field', fieldData, entityName)
        const entity = this.getCollectionByName(entityName)
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
      console.log('[Store] Updating field:', fieldName, 'in entity:', entityName)
      try {
        await schemaService.update('field', fieldName, fieldData, entityName)
        const entity = this.getCollectionByName(entityName)
        if (entity) {
          const fieldIndex = entity.fields.findIndex(f => f.name === fieldName)
          if (fieldIndex !== -1) {
            entity.fields[fieldIndex] = fieldData
          }
        }
      } catch (error) {
        console.error('[Store] Error updating field:', error)
        throw error
      }
    },

    async deleteField(entityName, fieldName) {
      console.log('[Store] Deleting field:', fieldName, 'from entity:', entityName)
      try {
        await schemaService.delete('field', fieldName, entityName)
        const entity = this.getCollectionByName(entityName)
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
        await schemaService.create('relation', { name: relationName, ...relationData }, entityName)
        const entity = this.getCollectionByName(entityName)
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
        await schemaService.update('relation', relationName, relationData, entityName)
        const entity = this.getCollectionByName(entityName)
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
        await schemaService.delete('relation', relationName, entityName)
        const entity = this.getCollectionByName(entityName)
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
