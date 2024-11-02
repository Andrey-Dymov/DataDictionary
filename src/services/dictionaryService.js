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
        available: true,
        path: '/api/fields/{parentName}/{id}',
        replaceParams: (url, id, parentName) => {
          return url
            .replace('{id}', id)
            .replace('{parentName}', parentName)
        }
      },
      delete: { 
        available: true,
        path: '/api/fields/{parentName}/{id}',
        replaceParams: (url, id, parentName) => {
          return url
            .replace('{id}', id)
            .replace('{parentName}', parentName)
        }
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
      create: { 
        available: true,
        path: '/api/relations/{parentName}',
        replaceParams: (url, parentName) => {
          return url.replace('{parentName}', parentName)
        }
      },
      update: { 
        available: true,
        path: '/api/relations/{parentName}/{relationName}',
        replaceParams: (url, relationName, parentName) => {
          return url
            .replace('{parentName}', parentName)
            .replace('{relationName}', relationName)
        }
      },
      delete: { 
        available: true,
        path: '/api/relations/{parentName}/{relationName}',
        replaceParams: (url, relationName, parentName) => {
          return url
            .replace('{parentName}', parentName)
            .replace('{relationName}', relationName)
        }
      }
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

class DictionaryService {
  constructor() {
    this.api = api
  }

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
      const response = await this.api.get(url, options)
      return response.data
    } catch (error) {
      console.error(`Error getting ${type} list:`, error)
      throw error
    }
  }

  async getOne(type, identifier) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.get.available) throw new Error(`Get not available for ${type}`)

    const url = `${config.path}/${identifier}`

    try {
      console.log(`[DictionaryService] Getting ${type} with id:`, identifier)
      console.log('[DictionaryService] Request URL:', url)
      const response = await this.api.get(url)
      console.log(`[DictionaryService] Got ${type} data:`, response.data)
      return response.data
    } catch (error) {
      console.error(`[DictionaryService] Error getting ${type}:`, error)
      throw error
    }
  }

  async create(type, parentName, data) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.create.available) throw new Error(`Create not available for ${type}`)
    
    const methodConfig = config.methods.create
    let url = methodConfig.path || config.path

    // Используем replaceParams если он определен
    if (methodConfig.replaceParams) {
      url = methodConfig.replaceParams(url, parentName)
    } else if (config.requiresParent && parentName) {
      url = `${url}/${parentName}`
    }

    console.log(`[DictionaryService] Creating ${type}:`, {
      url,
      parentName,
      data
    })

    try {
      const response = await this.api.post(url, data)
      return response.data
    } catch (error) {
      console.error(`[DictionaryService] Error creating ${type}:`, error)
      throw error
    }
  }

  async update(type, identifier, data, parentName = null) {
    const config = ENTITY_CONFIG[type]
    if (!config) throw new Error(`Unknown entity type: ${type}`)
    if (!config.methods.update.available) throw new Error(`Update not available for ${type}`)

    const methodConfig = config.methods.update
    let url = methodConfig.path || `${config.path}/${identifier}`
    
    // Используем replaceParams если он определен
    if (methodConfig.replaceParams) {
      url = methodConfig.replaceParams(url, identifier, parentName)
    }

    console.log(`[DictionaryService] Updating ${type}:`, { 
      type,
      identifier,
      parentName,
      url,
      data 
    })

    try {
      const response = await this.api.put(url, data)
      return response.data
    } catch (error) {
      console.error(`[DictionaryService] Error updating ${type}:`, error)
      throw error
    }
  }

  async delete(type, parentName, identifier, config = {}) {
    console.log('[DictionaryService] Delete request:', { type, identifier, parentName, config })
    
    const entityConfig = ENTITY_CONFIG[type]
    if (!entityConfig) throw new Error(`Unknown entity type: ${type}`)
    if (!entityConfig.methods.delete.available) throw new Error(`Delete not available for ${type}`)
    
    const methodConfig = entityConfig.methods.delete
    let url = methodConfig.path || `${entityConfig.path}/${identifier}`

    if (methodConfig.replaceParams) {
      url = methodConfig.replaceParams(url, identifier, parentName)
    } else {
      // Для relations формируем URL вручную
      if (type === 'relation') {
        url = `/api/relations/${parentName}/${identifier}`
      }
    }

    console.log('[DictionaryService] Delete URL:', url)

    try {
      const response = await this.api.delete(url)
      return response.data
    } catch (error) {
      console.error(`[DictionaryService] Error deleting ${type}:`, error)
      throw error
    }
  }

  async deleteField(entityName, fieldName) {
    return await this.delete('field', entityName, fieldName)
  }

  async deleteRelation(entityName, relationName) {
    return await this.delete('relation', entityName, relationName)
  }

  async deleteEntity(entityName) {
    return await this.delete('entity', null, entityName)
  }

  async deleteDictionary(dictionaryId) {
    return await this.delete('dictionary', null, dictionaryId)
  }
}

export default new DictionaryService()
