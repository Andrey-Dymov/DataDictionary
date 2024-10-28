import { defineStore } from 'pinia'
import dictionaryService from '../services/dictionaryService'

export const useDictionaryStore = defineStore('dictionary', {
  state: () => ({
    dictionaries: [],
    currentDictionary: null,
    currentDictionaryId: '',
    isLoading: false,
    error: null
  }),

  getters: {
    dictionaryOptions: (state) => state.dictionaries.map(dict => ({
      label: `${dict.name} (${dict.fileName} - ${dict.filePath})`,
      value: dict.id,
      ...dict
    })),
    
    getCurrentDictionary: (state) => state.currentDictionary,
    
    getIsLoading: (state) => state.isLoading,

    getCurrentDictionaryInfo: (state) => {
      const dict = state.dictionaries.find(d => d.id === state.currentDictionaryId)
      return dict ? {
        id: dict.id,
        name: dict.name,
        fileName: dict.fileName,
        filePath: dict.filePath,
        description: dict.description
      } : null
    }
  },

  actions: {
    async loadDictionariesMeta() {
      this.isLoading = true
      try {
        console.log('[Dictionary Store] Loading dictionaries metadata...')
        const data = await dictionaryService.getList('dictionaries')
        this.dictionaries = data.dictionaries
        
        if (!this.dictionaries?.length) {
          console.warn('[Dictionary Store] No dictionaries found')
          return
        }
        
        const savedId = localStorage.getItem('currentDictionaryId')
        console.log('[Dictionary Store] Saved dictionary ID:', savedId)
        
        if (savedId && this.dictionaries.find(d => d.id === savedId)) {
          console.log('[Dictionary Store] Restoring saved dictionary:', savedId)
          await this.setCurrentDictionary(savedId)
        } else if (this.dictionaries.length > 0) {
          console.log('[Dictionary Store] Using first dictionary:', this.dictionaries[0].id)
          await this.setCurrentDictionary(this.dictionaries[0].id)
        }
      } catch (error) {
        console.error('[Dictionary Store] Error loading dictionaries meta:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async setCurrentDictionary(id) {
      this.isLoading = true
      try {
        console.log('[Dictionary Store] Setting current dictionary:', id)
        localStorage.setItem('currentDictionaryId', id)
        this.currentDictionaryId = id

        const data = await dictionaryService.getOne('dictionary', id)
        this.currentDictionary = data
      } catch (error) {
        console.error('[Dictionary Store] Error setting current dictionary:', error)
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },

    async addDictionary(dictionaryData) {
      this.isLoading = true
      try {
        const newDictionary = await dictionaryService.create('dictionaries', dictionaryData)
        this.dictionaries.push(newDictionary)
        return newDictionary
      } catch (error) {
        console.error('[Dictionary Store] Error adding dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateDictionary(id, dictionaryData) {
      this.isLoading = true
      try {
        const updatedDictionary = await dictionaryService.update('dictionaries', id, dictionaryData)
        const index = this.dictionaries.findIndex(d => d.id === id)
        if (index !== -1) {
          this.dictionaries[index] = updatedDictionary
        }
        if (id === this.currentDictionaryId) {
          await this.setCurrentDictionary(id)
        }
        return updatedDictionary
      } catch (error) {
        console.error('[Dictionary Store] Error updating dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteDictionary(id) {
      this.isLoading = true
      try {
        await dictionaryService.delete('dictionaries', id)
        this.dictionaries = this.dictionaries.filter(d => d.id !== id)
        
        if (id === this.currentDictionaryId && this.dictionaries.length > 0) {
          await this.setCurrentDictionary(this.dictionaries[0].id)
        }
      } catch (error) {
        console.error('[Dictionary Store] Error deleting dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async saveDictionary(id, data) {
      this.isLoading = true
      try {
        await dictionaryService.update('dictionary', id, data)
        if (id === this.currentDictionaryId) {
          this.currentDictionary = data
        }
      } catch (error) {
        console.error('[Dictionary Store] Error saving dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})
