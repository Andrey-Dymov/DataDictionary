import { api } from '../boot/axios'

export default {
  async loadSchema(name) {
    console.log('[Service] Loading schema')
    console.log('[Service] Input name:', name)
    console.log('[Service] Input type:', typeof name)
    console.log('[Service] Input value:', JSON.stringify(name))

    try {
      // Изменяем URL для работы с новым API
      const url = `/api/dictionaries/${name}`  // Добавляем /api/

      console.log('[Service] Request URL:', url)
      console.log('[Service] Sending request')
      
      const response = await api.get(url)
      
      console.log('[Service] Response received')
      console.log('[Service] Status:', response.status)
      console.log('[Service] Headers:', response.headers)
      console.log('[Service] Data:', response.data)

      return response.data
    } catch (error) {
      console.log('[Service] Error loading schema:', error)
      console.log('[Service] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      throw new Error(`Ошибка HTTP: ${error.response?.status || error.message}`)
    }
  },

  async saveSchema(name, data) {
    console.log('[Service] Saving schema')
    console.log('[Service] Name:', name)
    console.log('[Service] Data:', data)

    try {
      // Изменяем URL для работы с новым API
      const url = `/api/dictionaries/${name}/data`  // Добавляем /api/
      const response = await api.post(url, { data })
      
      console.log('[Service] Schema saved successfully')
      return response.data
    } catch (error) {
      console.error('[Service] Error saving schema:', error)
      throw new Error(`Ошибка сохранения: ${error.message}`)
    }
  }
}
