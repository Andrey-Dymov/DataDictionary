const express = require('express')
const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const app = express()
app.use(express.json())

const SCHEMAS_DIR = path.join(__dirname, 'schemas')
const BACKUPS_DIR = path.join(SCHEMAS_DIR, 'backups')
const META_FILE = path.join(__dirname, 'dictionaries-meta.json')

// Security middleware
app.use((req, res, next) => {
  console.log('[Security] Setting CORS and security headers')
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:;")
  
  if (req.method === 'OPTIONS') {
    console.log('[Security] Handling OPTIONS request')
    return res.sendStatus(200)
  }
  next()
})

// API для работы с метаданными словарей
app.get('/api/dictionaries/meta', async (req, res) => {
  try {
    const exists = await fs.access(META_FILE).then(() => true).catch(() => false)
    console.log('[API] META_FILE exists:', exists)
    
    const data = await fs.readFile(META_FILE, 'utf8')
    const parsed = JSON.parse(data)
    console.log('[API] Successfully loaded dictionaries metadata:', parsed)
    res.json(parsed)
  } catch (error) {
    console.error('[API] Error loading dictionaries metadata:', error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы со словарями
app.get('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  try {
    console.log('[API] Getting dictionary:', id)
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const dictionary = dictionaries.find(d => d.id === id)
    
    if (!dictionary) {
      throw new Error('Dictionary not found')
    }

    const filePath = path.join(dictionary.filePath, dictionary.fileName)
    console.log('[API] Reading file:', filePath)
    
    const data = await fs.readFile(filePath, 'utf8')
    console.log('[API] Raw file data:', data)
    
    const dictionaryData = JSON.parse(data)
    console.log('[API] Parsed dictionary data:', dictionaryData)
    
    // Конвертируем данные из старого формата в новый
    const convertedData = {
      ...dictionaryData,
      entities: dictionaryData.collections || [],
      version: dictionaryData.version || "1.0"
    }
    delete convertedData.collections
    
    console.log('[API] Converted data:', convertedData)
    res.json(convertedData)
  } catch (error) {
    console.error(`[API] Error reading dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/dictionaries', async (req, res) => {
  const dictionaryData = req.body
  try {
    const newDictionary = {
      ...dictionaryData,
      id: `dict_${uuidv4()}`
    }

    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    data.dictionaries.push(newDictionary)
    
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    const filePath = path.join(newDictionary.filePath, newDictionary.fileName)
    // Создаем файл с начальной структурой
    const initialData = {
      entities: [],  // Массив сущностей
      version: "1.0",
      description: newDictionary.description || ""
    }
    await fs.writeFile(filePath, JSON.stringify(initialData, null, 2))
    
    res.json(newDictionary)
  } catch (error) {
    console.error('[API] Error creating dictionary:', error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы со словарями (продолжение)
app.put('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  const dictionaryData = req.body
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    const index = data.dictionaries.findIndex(d => d.id === id)
    if (index === -1) {
      throw new Error('Dictionary not found')
    }

    const oldDictionary = data.dictionaries[index]
    
    if (oldDictionary.filePath !== dictionaryData.filePath || 
        oldDictionary.fileName !== dictionaryData.fileName) {
      const oldPath = path.join(oldDictionary.filePath, oldDictionary.fileName)
      const newPath = path.join(dictionaryData.filePath, dictionaryData.fileName)
      
      const content = await fs.readFile(oldPath, 'utf8')
      await fs.writeFile(newPath, content)
    }

    data.dictionaries[index] = {
      ...oldDictionary,
      ...dictionaryData,
      id
    }
    
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    res.json(data.dictionaries[index])
  } catch (error) {
    console.error(`[API] Error updating dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    data.dictionaries = data.dictionaries.filter(d => d.id !== id)
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error deleting dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/dictionaries/:id/data', async (req, res) => {
  const { id } = req.params
  const { data: dictionaryData } = req.body
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const dictionary = dictionaries.find(d => d.id === id)
    
    if (!dictionary) {
      throw new Error('Dictionary not found')
    }

    // Конвертируем данные из старого формата в новый
    const dataToSave = {
      ...dictionaryData,
      // Если есть collections, но нет entities - конвертируем
      entities: dictionaryData.collections || dictionaryData.entities || [],
      version: "1.0"
    }
    // Удаляем старое поле collections если оно есть
    delete dataToSave.collections

    const filePath = path.join(dictionary.filePath, dictionary.fileName)
    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2))
    
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error saving dictionary data ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы с сущностями (entities)
app.get('/api/entities', async (req, res) => {
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const allEntities = []
    
    for (const dict of dictionaries) {
      const filePath = path.join(dict.filePath, dict.fileName)
      const data = await fs.readFile(filePath, 'utf8')
      const { entities } = JSON.parse(data)
      allEntities.push(...entities)
    }
    
    res.json(allEntities)
  } catch (error) {
    console.error('[API] Error getting entities:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/entities/:name', async (req, res) => {
  const { name } = req.params
  try {
    const entity = await findEntityInDictionaries(name)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    res.json(entity)
  } catch (error) {
    console.error('[API] Error getting entity:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/entities', async (req, res) => {
  const entityData = req.body
  try {
    const { dictionary } = await findEntityAndDictionary(entityData.name)
    if (dictionary) {
      return res.status(400).json({ error: 'Entity already exists' })
    }

    // Получаем текущий словарь
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const currentDict = dictionaries[0] // Используем первый словарь как текущий

    const filePath = path.join(currentDict.filePath, currentDict.fileName)
    const data = await fs.readFile(filePath, 'utf8')
    const dictionaryData = JSON.parse(data)

    dictionaryData.entities.push(entityData)
    await fs.writeFile(filePath, JSON.stringify(dictionaryData, null, 2))

    res.json(entityData)
  } catch (error) {
    console.error('[API] Error creating entity:', error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/entities/:name', async (req, res) => {
  const { name } = req.params
  const entityData = req.body
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(name)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    const index = dictionary.entities.findIndex(e => e.name === name)
    dictionary.entities[index] = entityData

    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json(entityData)
  } catch (error) {
    console.error('[API] Error updating entity:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/entities/:name', async (req, res) => {
  const { name } = req.params
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(name)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    dictionary.entities = dictionary.entities.filter(e => e.name !== name)
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting entity:', error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы с полями (fields)
app.get('/api/fields/:entityName', async (req, res) => {
  const { entityName } = req.params
  try {
    const entity = await findEntityInDictionaries(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    res.json(entity.fields || [])
  } catch (error) {
    console.error('[API] Error getting fields:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/fields/:entityName', async (req, res) => {
  const { entityName } = req.params
  const fieldData = req.body
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    entity.fields = entity.fields || []
    entity.fields.push(fieldData)
    
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json(fieldData)
  } catch (error) {
    console.error('[API] Error creating field:', error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/fields/:entityName/:fieldName', async (req, res) => {
  const { entityName, fieldName } = req.params
  const fieldData = req.body
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    const fieldIndex = entity.fields.findIndex(f => f.name === fieldName)
    if (fieldIndex === -1) {
      return res.status(404).json({ error: 'Field not found' })
    }

    entity.fields[fieldIndex] = fieldData
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json(fieldData)
  } catch (error) {
    console.error('[API] Error updating field:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/fields/:entityName/:fieldName', async (req, res) => {
  const { entityName, fieldName } = req.params
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    entity.fields = entity.fields.filter(f => f.name !== fieldName)
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting field:', error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы со связями (relations)
app.get('/api/relations/:entityName', async (req, res) => {
  const { entityName } = req.params
  try {
    const entity = await findEntityInDictionaries(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    res.json(entity.relations || {})
  } catch (error) {
    console.error('[API] Error getting relations:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/relations/:entityName', async (req, res) => {
  const { entityName } = req.params
  const { name, ...relationData } = req.body
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    entity.relations = entity.relations || {}
    entity.relations[name] = relationData
    
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json(relationData)
  } catch (error) {
    console.error('[API] Error creating relation:', error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/relations/:entityName/:relationName', async (req, res) => {
  const { entityName, relationName } = req.params
  const relationData = req.body
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    entity.relations = entity.relations || {}
    entity.relations[relationName] = relationData
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    res.json(relationData)
  } catch (error) {
    console.error('[API] Error updating relation:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/relations/:entityName/:relationName', async (req, res) => {
  const { entityName, relationName } = req.params
  try {
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }

    if (entity.relations) {
      delete entity.relations[relationName]
      await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    }
    res.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting relation:', error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы с файловой системой
app.get('/api/filesystem/select-file', async (req, res) => {
  console.log('[API] Getting files list')
  const dirPath = req.query.path
  
  try {
    if (!dirPath) {
      throw new Error('Path is required')
    }

    // Проверяем существование каталога
    try {
      await fs.access(dirPath)
    } catch {
      throw new Error(`Directory not found: ${dirPath}`)
    }

    console.log('[API] Reading directory:', dirPath)
    const files = await fs.readdir(dirPath)
    
    // Получаем информацию о каждом файле
    const fileInfos = await Promise.all(
      files
        .filter(file => file.endsWith('.json')) // Фильтруем только JSON файлы
        .map(async file => {
          const filePath = path.join(dirPath, file)
          const stats = await fs.stat(filePath)
          return {
            name: file,
            size: formatFileSize(stats.size),
            modified: stats.mtime.toLocaleString()
          }
        })
    )

    console.log('[API] Files found:', fileInfos)
    res.json(fileInfos)
  } catch (error) {
    console.error('[API] Error getting files:', error)
    res.status(500).json({ error: error.message })
  }
})

// Вспомогательные функции
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function findEntityInDictionaries(entityName) {
  const metaData = await fs.readFile(META_FILE, 'utf8')
  const { dictionaries } = JSON.parse(metaData)
  
  for (const dict of dictionaries) {
    const filePath = path.join(dict.filePath, dict.fileName)
    const data = await fs.readFile(filePath, 'utf8')
    const { entities } = JSON.parse(data)  // Используем entities вместо collections
    const entity = entities.find(e => e.name === entityName)
    if (entity) {
      return entity
    }
  }
  return null
}

async function findEntityAndDictionary(entityName) {
  const metaData = await fs.readFile(META_FILE, 'utf8')
  const { dictionaries } = JSON.parse(metaData)
  
  for (const dict of dictionaries) {
    const filePath = path.join(dict.filePath, dict.fileName)
    const data = await fs.readFile(filePath, 'utf8')
    const dictionary = JSON.parse(data)
    const entity = dictionary.entities?.find(e => e.name === entityName)  // Используем entities вместо collections
    if (entity) {
      return { dictionary, entity, filePath }
    }
  }
  return { dictionary: null, entity: null, filePath: null }
}

// Initialize data and start server
async function initializeData() {
  console.log('[Init] Starting data initialization')
  try {
    await fs.mkdir(SCHEMAS_DIR, { recursive: true })
    await fs.mkdir(BACKUPS_DIR, { recursive: true })
    console.log('[Init] Directories created')

    try {
      await fs.access(META_FILE)
      console.log('[Init] Meta file exists')
    } catch {
      console.log('[Init] Creating meta file')
      await fs.writeFile(META_FILE, JSON.stringify({
        dictionaries: []
      }, null, 2))
    }

    console.log('[Init] Data initialization completed')
  } catch (error) {
    console.error('[Init] Error initializing data:', error)
  }
}

// Start server
initializeData().then(() => {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    console.log('='.repeat(50))
    console.log(`[Server] API server running on port ${port}`)
    console.log(`[Server] Meta file path: ${META_FILE}`)
    console.log(`[Server] Schemas directory: ${SCHEMAS_DIR}`)
    console.log(`[Server] Available endpoints:`)
    
    // Словари (dictionaries)
    console.log('\n[Server] Dictionaries:')
    console.log(`[Server] - GET    /api/dictionaries/meta         - Get all dictionaries`)
    console.log(`[Server] - GET    /api/dictionaries/:id          - Get dictionary by id`)
    console.log(`[Server] - POST   /api/dictionaries              - Create dictionary`)
    console.log(`[Server] - PUT    /api/dictionaries/:id          - Update dictionary`)
    console.log(`[Server] - DELETE /api/dictionaries/:id          - Delete dictionary`)
    console.log(`[Server] - POST   /api/dictionaries/:id/data     - Save dictionary data`)

    // Сущности (entities)
    console.log('\n[Server] Entities:')
    console.log(`[Server] - GET    /api/entities                  - Get all entities`)
    console.log(`[Server] - GET    /api/entities/:name            - Get entity by name`)
    console.log(`[Server] - POST   /api/entities                  - Create entity`)
    console.log(`[Server] - PUT    /api/entities/:name            - Update entity`)
    console.log(`[Server] - DELETE /api/entities/:name            - Delete entity`)

    // Поля (fields)
    console.log('\n[Server] Fields:')
    console.log(`[Server] - GET    /api/fields/:entityName        - Get entity fields`)
    console.log(`[Server] - POST   /api/fields/:entityName        - Create field`)
    console.log(`[Server] - PUT    /api/fields/:entityName/:name  - Update field`)
    console.log(`[Server] - DELETE /api/fields/:entityName/:name  - Delete field`)

    // Связи (relations)
    console.log('\n[Server] Relations:')
    console.log(`[Server] - GET    /api/relations/:entityName     - Get entity relations`)
    console.log(`[Server] - POST   /api/relations/:entityName     - Create relation`)
    console.log(`[Server] - PUT    /api/relations/:entityName/:name - Update relation`)
    console.log(`[Server] - DELETE /api/relations/:entityName/:name - Delete relation`)

    // Файловая система
    console.log('\n[Server] Filesystem:')
    console.log(`[Server] - POST   /api/filesystem/select-directory - Get available directories`)
    console.log(`[Server] - POST   /api/filesystem/select-file     - Get files in directory`)
    
    console.log('='.repeat(50))
  })
})
