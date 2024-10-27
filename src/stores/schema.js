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
      console.log('[Store/Action] Loading dictionaries')
      const dictionaryStore = useDictionaryStore()
      await dictionaryStore.loadDictionariesMeta()
    },

    async loadSchema(dictionaryId) {
      console.log('[Store/Action] Loading schema for dictionary:', dictionaryId)
      this.isLoading = true
      try {
        const data = await schemaService.loadSchema(dictionaryId)
        this.collections = data.collections
        this.isLoaded = true
        console.log('[Store/Action] Schema loaded:', data)

        // После загрузки схемы восстанавливаем сохраненную сущность
        const savedSelections = JSON.parse(localStorage.getItem('selectedCollections') || '{}')
        const savedCollection = savedSelections[dictionaryId]
        
        // Если есть сохраненная сущность и она существует в текущем словаре
        if (savedCollection && this.collections.find(c => c.name === savedCollection)) {
          console.log('[Store/Action] Restoring saved collection:', savedCollection)
          this.selectedCollectionName = savedCollection
        } else if (this.collections.length > 0) {
          // Если нет сохраненной сущности, выбираем первую
          console.log('[Store/Action] Selecting first collection:', this.collections[0].name)
          this.selectedCollectionName = this.collections[0].name
        }

      } catch (error) {
        console.error('[Store/Action] Error loading schema:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    setSelectedCollection(name) {
      console.log('[SchemaStore] Setting selected collection:', name)
      this.selectedCollectionName = name
      
      // Получаем текущий словарь
      const dictionaryStore = useDictionaryStore()
      const currentDictionaryId = dictionaryStore.currentDictionaryId
      
      if (currentDictionaryId) {
        // Сохраняем выбранную сущность для конкретного словаря
        const savedSelections = JSON.parse(localStorage.getItem('selectedCollections') || '{}')
        savedSelections[currentDictionaryId] = name
        localStorage.setItem('selectedCollections', JSON.stringify(savedSelections))
      }
    },

    async updateCollection(name, data) {
      const dictionaryStore = useDictionaryStore()
      const index = this.collections.findIndex(c => c.name === name)
      if (index !== -1) {
        this.collections[index] = data
        await dictionaryStore.saveDictionary(
          dictionaryStore.currentDictionaryId, 
          { collections: this.collections }
        )
      }
    },

    async addCollection(data) {
      const dictionaryStore = useDictionaryStore()
      this.collections.push(data)
      await dictionaryStore.saveDictionary(
        dictionaryStore.currentDictionaryId, 
        { collections: this.collections }
      )
    },

    async deleteCollection(name) {
      const dictionaryStore = useDictionaryStore()
      this.collections = this.collections.filter(c => c.name !== name)
      await dictionaryStore.saveDictionary(
        dictionaryStore.currentDictionaryId, 
        { collections: this.collections }
      )
    }
  }
})
