const API_BASE = '/api/schemas'

export const schemaService = {
  async loadSchema(dictionaryName) {
    console.log('[Service] Loading schema')
    console.log('[Service] Input name:', dictionaryName)
    console.log('[Service] Input type:', typeof dictionaryName)
    console.log('[Service] Input value:', JSON.stringify(dictionaryName))
    
    if (!dictionaryName || typeof dictionaryName !== 'string') {
      console.error('[Service] Invalid dictionary name:', dictionaryName)
      console.error('[Service] Dictionary type:', typeof dictionaryName)
      throw new Error('Неверное имя словаря')
    }

    try {
      // Приводим к строке и кодируем
      const encodedName = encodeURIComponent(String(dictionaryName))
      const url = `${API_BASE}/${encodedName}`
      console.log('[Service] Request URL:', url)
      
      console.log('[Service] Sending request')
      const response = await fetch(url)
      console.log('[Service] Response received')
      console.log('[Service] Status:', response.status)
      console.log('[Service] Headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.error('[Service] HTTP error:', response.status)
        console.error('[Service] Response:', response)
        throw new Error(`Ошибка HTTP: ${response.status}`)
      }
      
      const text = await response.text()
      console.log('[Service] Raw response text:', text)
      
      const data = JSON.parse(text)
      console.log('[Service] Parsed response:', data)
      
      if (!data || typeof data !== 'object') {
        console.error('[Service] Invalid response type:', typeof data)
        throw new Error('Получены неверные данные')
      }
      
      return data
    } catch (error) {
      console.error('[Service] Error loading schema:', error)
      console.error('[Service] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      throw error
    }
  },

  async saveSchema(dictionaryName, schema) {
    console.log('[Service] Saving schema')
    console.log('[Service] Dictionary:', dictionaryName)
    console.log('[Service] Schema:', schema)
    
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(String(dictionaryName))}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schema)
      })
      
      console.log('[Service] Save response:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('[Service] Save result:', result)
      return result
    } catch (error) {
      console.error('[Service] Error saving schema:', error)
      throw error
    }
  },

  async backupSchema(dictionaryName) {
    console.log('[Service] Creating backup')
    console.log('[Service] Dictionary:', dictionaryName)
    
    try {
      const schema = await this.loadSchema(dictionaryName)
      const response = await fetch(`${API_BASE}/backup/${encodeURIComponent(String(dictionaryName))}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schema)
      })
      
      console.log('[Service] Backup response:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('[Service] Backup result:', result)
      return result.backupName
    } catch (error) {
      console.error('[Service] Error creating backup:', error)
      return null
    }
  }
}