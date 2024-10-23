import { defineStore } from 'pinia'
import { schemaService } from '../services/schemaService'

export const useSchemaStore = defineStore('schema', {
  state: () => {
    console.log('[Store] Initializing state')
    
    // Получаем значение из localStorage
    const savedDictionary = localStorage.getItem('currentDictionary')
    console.log('[Store] Saved dictionary from localStorage:', savedDictionary)
    
    // Значение по умолчанию
    const defaultDictionary = 'original'
    
    // Пытаемся восстановить сохраненное значение
    let currentDictionary = defaultDictionary
    if (savedDictionary) {
      try {
        const parsed = JSON.parse(savedDictionary)
        console.log('[Store] Parsed dictionary:', parsed)
        
        if (typeof parsed === 'string' && parsed) {
          currentDictionary = parsed
          console.log('[Store] Using saved dictionary:', currentDictionary)
        } else {
          console.warn('[Store] Invalid saved dictionary, using default')
        }
      } catch (error) {
        console.warn('[Store] Error parsing saved dictionary:', error)
      }
    }
    
    return {
      dictionaries: {
        'original': 'Оригинальный словарь',
        'new': 'Новый словарь'
      },
      currentDictionary,
      collections: [],
      selectedCollectionName: localStorage.getItem('selectedCollectionName') || null,
      isLoading: false,
      isLoaded: false,
      error: null,
    }
  },

  getters: {
    getCurrentDictionary: (state) => {
      // Проверяем текущее значение
      const value = state.currentDictionary
      console.log('[Store/Getter] Current dictionary:', value)
      
      if (!value || typeof value !== 'string') {
        console.warn('[Store/Getter] Invalid dictionary value, using default')
        return 'original'
      }
      
      return value
    },

    getCollectionByName: (state) => (name) => {
      console.log('[Store/Getter] Getting collection:', name)
      if (!name || !state.collections) {
        console.warn('[Store/Getter] Invalid collection name or no collections')
        return null
      }
      const collection = state.collections.find(c => c.name === name)
      console.log('[Store/Getter] Found collection:', collection?.name)
      return collection
    }
  },

  actions: {
    setCurrentDictionary(value) {
      console.log('[Store/Action] Setting dictionary:', value)
      
      // Проверяем входное значение
      if (!value || typeof value !== 'string') {
        console.warn('[Store/Action] Invalid dictionary value, using default')
        value = 'original'
      }
      
      // Обновляем состояние
      this.currentDictionary = value
      
      // Сохраняем в localStorage
      localStorage.setItem('currentDictionary', JSON.stringify(value))
      console.log('[Store/Action] Dictionary saved:', value)
    },

    setSelectedCollection(collectionName) {
      console.log('[Store/Action] Setting selected collection:', collectionName)
      this.selectedCollectionName = collectionName
      if (collectionName) {
        localStorage.setItem('selectedCollectionName', collectionName)
      } else {
        localStorage.removeItem('selectedCollectionName')
      }
    },

    async loadDictionaries() {
      console.log('[Store/Action] Loading dictionaries')
      try {
        const response = await schemaService.loadSchema('dictionaries')
        console.log('[Store/Action] Dictionaries loaded:', response)
        
        if (response && typeof response === 'object') {
          this.dictionaries = response
        }
      } catch (error) {
        console.error('[Store/Action] Error loading dictionaries:', error)
      }
    },

    async loadSchema(dictionaryName = null) {
      console.log('[Store/Action] Loading schema for:', dictionaryName)
      
      if (this.isLoading) {
        console.log('[Store/Action] Already loading, skipping')
        return
      }
      
      // Используем переданное имя или текущее значение
      const name = dictionaryName || this.getCurrentDictionary
      
      if (!name || typeof name !== 'string') {
        console.error('[Store/Action] Invalid dictionary name')
        throw new Error('Некорректное имя словаря')
      }
      
      this.isLoading = true
      this.error = null
      
      try {
        const schema = await schemaService.loadSchema(name)
        console.log('[Store/Action] Schema loaded:', schema)
        
        if (!schema || !Array.isArray(schema.collections)) {
          throw new Error('Неверный формат схемы')
        }
        
        this.collections = schema.collections
        this.currentDictionary = name
        this.isLoaded = true
        
        if (!this.selectedCollectionName || 
            !this.collections.find(c => c.name === this.selectedCollectionName)) {
          this.setSelectedCollection(this.collections[0]?.name || null)
        }
        
        return schema
      } catch (error) {
        console.error('[Store/Action] Error loading schema:', error)
        this.error = `Ошибка загрузки схемы: ${error.message}`
        this.isLoaded = false
        this.collections = []
        this.selectedCollectionName = null
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})