import { api } from '../boot/axios'

// Единая конфигурация типов данных
const ENTITY_CONFIG = {
  dictionaries: {
    path: '/api/dictionaries/meta',
    requiresParent: false,
    identifyBy: 'id',
    methods: {
      list: { available: true },
      get: { available: true },
      create: { available: true },
      update: { 
        available: true,
        path: '/api/dictionaries/{id}'  // Добавляем правильный путь для обновления
      },
      delete: { available: true }
    }
  },
  dictionary: {
    path: '/api/dictionaries',
    requiresParent: false,
    identifyBy: 'id',
    methods: {
      list: { available: false },
      get: { available: true },
      create: { available: false },
      update: { 
        available: true,
        path: '/api/dictionaries/{id}/data' 
      },
      delete: { available: false }
    }
  },
  entity: {
    path: '/api/entities',
    requiresParent: false,
    identifyBy: 'name',
    methods: {
      list: { available: true },
      get: { available: true },
      create: { available: true },
      update: { available: true },
      delete: { available: true }
    }
  },
  field: {
    path: '/api/fields',
    requiresParent: true,
    identifyBy: 'name',
    methods: {
      list: { available: true },
      get: { available: true },
      create: { available: true },
      update: { 
        available: true,  // Добавляем available: true
        path: '/api/fields/{parentName}/{id}' 
      },
      delete: { 
        available: true,  // Для единообразия добавим и сюда
        path: '/api/fields/{parentName}/{id}' 
      }
    }
  },
  relation: {
    path: '/api/relations',
    requiresParent: true,
    identifyBy: 'name',
    methods: {
      list: { available: true },
      get: { available: true },
      create: { available: true },
      update: { path: '/api/relations/{parentName}/{id}' },
      delete: { path: '/api/relations/{parentName}/{id}' }
    }
  },
  files: {
    path: '/api/filesystem/select-file',
    requiresParent: false, // Меняем на false
    identifyBy: 'name',
    methods: {
      list: { 
        available: true,
        useQuery: true // Добавляем флаг для использования query параметров
      },
      get: { available: false },
      create: { available: false },
      update: { available: false },
      delete: { available: false }
    }
  }
}

export default {
  async getList(type, parentName = null, params = null) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.list.available) throw new Error(`List not available for ${type}`)

    const url = config.requiresParent && parentName
      ? `${config.path}/${parentName}`
      : config.path

    try {
      // Используем params только если useQuery = true
      const options = config.methods.list.useQuery ? { params } : {}
      const response = await api.get(url, options)
      return response.data
    } catch (error) {
      console.error(`Error getting ${type} list:`, error)
      throw error
    }
  },

  async getOne(type, identifier) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.get.available) throw new Error(`Get not available for ${type}`)

    const url = `${config.path}/${identifier}`

    try {
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error(`Error getting ${type}:`, error)
      throw error
    }
  },

  async create(type, data, parentName = null) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.create.available) throw new Error(`Create not available for ${type}`)
    if (config.requiresParent && !parentName) throw new Error(`Parent name is required for ${type}`)

    const url = config.requiresParent
      ? `${config.path}/${parentName}`
      : config.path

    try {
      const response = await api.post(url, data)
      return response.data
    } catch (error) {
      console.error(`Error creating ${type}:`, error)
      throw error
    }
  },

  async update(type, identifier, data, parentName = null) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.update.available) throw new Error(`Update not available for ${type}`)

    const methodConfig = config.methods.update
    let url = methodConfig.path || `${config.path}/${identifier}`
    
    // Заменяем параметры в URL
    url = url
      .replace('{id}', identifier)
      .replace('{parentName}', parentName || '')

    try {
      const response = await api.put(url, data)
      return response.data
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      throw error
    }
  },

  async delete(type, identifier, parentName = null) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.delete.available) throw new Error(`Delete not available for ${type}`)

    const methodConfig = config.methods.delete
    let url = methodConfig.path || `${config.path}/${identifier}`
    
    // Заменяем параметры в URL
    url = url
      .replace('{id}', identifier)
      .replace('{parentName}', parentName || '')

    try {
      const response = await api.delete(url)
      return response.data
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)
      throw error
    }
  }
}
