import { defineStore } from 'pinia'
import { api } from '../boot/axios'

export const useDictionaryStore = defineStore('dictionary', {
  state: () => ({
    dictionaries: [],        // список всех словарей из метаинформации
    currentDictionary: null, // текущий выбранный словарь (полная информация)
    currentDictionaryId: '', // id текущего словаря
    isLoading: false,
    error: null
  }),

  getters: {
    // Получение списка словарей для выпадающего списка
    dictionaryOptions: (state) => state.dictionaries.map(dict => ({
      label: `${dict.name} (${dict.fileName} - ${dict.filePath})`,
      value: dict.id,
      ...dict
    })),

    // Получение текущего словаря
    getCurrentDictionary: (state) => state.currentDictionary,
    
    // Проверка загрузки
    getIsLoading: (state) => state.isLoading,

    // Получение информации о текущем словаре
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
    // Загрузка метаинформации о словарях
    async loadDictionariesMeta() {
      this.isLoading = true
      try {
        console.log('[Dictionary Store] Loading dictionaries metadata...')
        const response = await api.get('/api/dictionaries/meta')
        console.log('[Dictionary Store] Received metadata:', response.data)
        this.dictionaries = response.data.dictionaries
        
        if (!this.dictionaries?.length) {
          console.warn('[Dictionary Store] No dictionaries found')
          return
        }
        
        // Восстанавливаем последний выбранный словарь
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

    // Установка текущего словаря
    async setCurrentDictionary(id) {
      this.isLoading = true
      try {
        console.log('[Dictionary Store] Setting current dictionary:', id)
        localStorage.setItem('currentDictionaryId', id)
        this.currentDictionaryId = id

        const response = await api.get(`/api/dictionaries/${id}`)
        console.log('[Dictionary Store] Loaded dictionary data:', response.data)
        this.currentDictionary = response.data
      } catch (error) {
        console.error('[Dictionary Store] Error setting current dictionary:', error)
        this.error = error.message
      } finally {
        this.isLoading = false
      }
    },

    // Добавление нового словаря
    async addDictionary(dictionaryData) {
      this.isLoading = true
      try {
        const response = await api.post('/api/dictionaries', dictionaryData)
        this.dictionaries.push(response.data)
        return response.data
      } catch (error) {
        console.error('Error adding dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Обновление словаря
    async updateDictionary(id, dictionaryData) {
      this.isLoading = true
      try {
        const response = await api.put(`/api/dictionaries/${id}`, dictionaryData)
        const index = this.dictionaries.findIndex(d => d.id === id)
        if (index !== -1) {
          this.dictionaries[index] = response.data
        }
        if (id === this.currentDictionaryId) {
          await this.setCurrentDictionary(id)
        }
        return response.data
      } catch (error) {
        console.error('Error updating dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Удаление словаря
    async deleteDictionary(id) {
      this.isLoading = true
      try {
        await api.delete(`/api/dictionaries/${id}`)
        this.dictionaries = this.dictionaries.filter(d => d.id !== id)
        
        // Если удалили текущий словарь, выбираем первый доступный
        if (id === this.currentDictionaryId && this.dictionaries.length > 0) {
          await this.setCurrentDictionary(this.dictionaries[0].id)
        }
      } catch (error) {
        console.error('Error deleting dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Сохранение изменений в словаре
    async saveDictionary(id, data) {
      this.isLoading = true
      try {
        await api.post(`/api/dictionaries/${id}/data`, { data })
        if (id === this.currentDictionaryId) {
          this.currentDictionary = data
        }
      } catch (error) {
        console.error('Error saving dictionary:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})
