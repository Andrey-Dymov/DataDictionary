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
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob:;")
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Middleware для логирования запросов
app.use((req, res, next) => {
    // Извлекаем параметры из URL
    const urlParts = req.url.split('/')
    const params = {}
    
    // Парсим параметры из URL в зависимости от пути
    if (req.url.startsWith('/api/fields/')) {
        params.entityName = urlParts[3]
        params.fieldName = urlParts[4]
    } 
    else if (req.url.startsWith('/api/relations/')) {
        params.entityName = urlParts[3]
        params.relationName = urlParts[4]
    }
    else if (req.url.startsWith('/api/entities/')) {
        params.entityName = urlParts[3]
    }
    else if (req.url.startsWith('/api/dictionaries/')) {
        if (urlParts[3] === 'meta') {
            params.type = 'meta'
        } else {
            params.dictionaryId = urlParts[3]
            if (urlParts[4] === 'data') {
                params.type = 'data'
            }
        }
    }

    // Формируем сообщение лога в зависимости от типа запроса
    let logMessage = `[API:Middleware] ${req.method} ${req.originalUrl}`
    
    // Добавляем детали операции
    if (req.method === 'PUT' && req.url.startsWith('/api/fields/')) {
        logMessage = `[API:Middleware] Update field: ${params.entityName}.${params.fieldName} -> ${req.body.name}`
    }
    else if (req.method === 'DELETE' && req.url.startsWith('/api/relations/')) {
        logMessage = `[API:Middleware] Delete relation: ${params.entityName}.${params.relationName}`
    }
    else if (req.method === 'POST' && req.url.startsWith('/api/relations/')) {
        logMessage = `[API:Middleware] Create relation: ${params.entityName}.${req.body.name}`
    }
    else if (req.method === 'PUT' && req.url.startsWith('/api/relations/')) {
        logMessage = `[API:Middleware] Update relation: ${params.entityName}.${params.relationName}`
    }
    else if (req.method === 'GET' && req.url.startsWith('/api/dictionaries/')) {
        if (params.type === 'meta') {
            logMessage = '[API:Middleware] Get dictionaries metadata'
        } else {
            logMessage = `[API:Middleware] Get dictionary: ${params.dictionaryId}`
        }
    }

    // Выводим лог
    console.log(logMessage, {
        params,
        body: req.method !== 'GET' ? req.body : undefined
    })

    // Отключаем логирование в обработчиках
    req.logged = true
    
    next()
})

// API для работы с метаданными словарей
app.get('/api/dictionaries/meta', async (req, res) => {
  try {
    console.log('[API] Loading dictionaries metadata')
    const data = await fs.readFile(META_FILE, 'utf8')
    res.json(JSON.parse(data))
  } catch (error) {
    console.error('[API] Error loading dictionaries metadata:', error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы со словарями
app.get('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  try {
    console.log('[API] Loading dictionary:', id)
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const dictionary = dictionaries.find(d => d.id === id)
    
    if (!dictionary) {
      throw new Error('Dictionary not found')
    }

    const filePath = path.join(dictionary.filePath, dictionary.fileName)
    const data = await fs.readFile(filePath, 'utf8')
    res.json(JSON.parse(data))
  } catch (error) {
    console.error(`[API] Error loading dictionary ${id}:`, error)
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

    const filePath = path.join(dictionary.filePath, dictionary.fileName)
    await fs.writeFile(filePath, JSON.stringify(dictionaryData, null, 2))
    
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
    console.log('[API] GET entity:', { name })
    const entity = await findEntityInDictionaries(name)
    console.log('[API] Entity found:', { name, fields: entity.fields?.length || 0 })
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
    console.log('[API] GET fields for entity:', { entityName })
    const entity = await findEntityInDictionaries(entityName)
    console.log('[API] Fields found:', { entityName, count: entity.fields?.length || 0 })
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
        
        // Ищем поле по старому имени
        const fieldIndex = entity.fields.findIndex(f => f.name === fieldName)
        if (fieldIndex === -1) {
            throw new Error(`Field ${fieldName} not found in entity ${entityName}`)
        }
        
        // Обновляем поле
        entity.fields[fieldIndex] = fieldData
        
        // Сохраняем изменения
        await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
        
        res.json({ success: true })
    } catch (error) {
        console.error('[API] Error updating field:', error)
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/fields/:entityName/:fieldName', async (req, res) => {
  const { entityName, fieldName } = req.params
  try {
    console.log('\n[API] DELETE /api/fields/:entityName/:fieldName')
    console.log('[API] Request params:', { entityName, fieldName })
    
    // Находим словарь и сущность
    const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
    if (!dictionary || !entity) {
      console.error('[API] Entity not found:', entityName)
      return res.status(404).json({ error: 'Entity not found' })
    }
    console.log('[API] Entity found:', entityName)

    // Находим поле
    const fieldIndex = entity.fields.findIndex(f => f.name === fieldName)
    if (fieldIndex === -1) {
      console.error('[API] Field not found:', fieldName)
      return res.status(404).json({ error: 'Field not found' })
    }
    console.log('[API] Field found:', fieldName)

    // Удаляем поле
    entity.fields.splice(fieldIndex, 1)
    console.log('[API] Removed field from entity')

    // Обновляем сущность в словаре
    const entityIndex = dictionary.entities.findIndex(e => e.name === entityName)
    if (entityIndex !== -1) {
      dictionary.entities[entityIndex] = entity
      console.log('[API] Updated entity in dictionary')
    }

    // Сохраняем изменения в файл
    console.log('[API] Saving changes to file:', filePath)
    await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
    console.log('[API] Changes saved successfully')
    
    res.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting field:', error)
    console.error('[API] Error stack:', error.stack)
    res.status(500).json({ error: error.message })
  }
})

// API для работы со связями (relations)
app.post('/api/relations/:entityName', async (req, res) => {
    const { entityName } = req.params
    const { name, ...relationData } = req.body
    
    try {
        // Убираем дублирующий лог
        const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
        
        entity.relations = entity.relations || {}
        entity.relations[name] = relationData
        await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
        
        res.json({ success: true })
    } catch (error) {
        console.error('[API] Error creating relation:', error)
        res.status(500).json({ error: error.message })
    }
})

app.put('/api/relations/:entityName/:relationName', async (req, res) => {
    const { entityName, relationName } = req.params
    const relationData = req.body
    
    try {
        // Убираем дублирующий лог
        const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
        
        entity.relations = entity.relations || {}
        entity.relations[relationName] = relationData
        await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
        
        res.json({ success: true })
    } catch (error) {
        console.error('[API] Error updating relation:', error)
        res.status(500).json({ error: error.message })
    }
})

app.delete('/api/relations/:entityName/:relationName', async (req, res) => {
    const { entityName, relationName } = req.params
    
    try {
        // Убираем дублирующий лог
        const { dictionary, entity, filePath } = await findEntityAndDictionary(entityName)
        
        if (entity.relations && entity.relations[relationName]) {
            delete entity.relations[relationName]
            await fs.writeFile(filePath, JSON.stringify(dictionary, null, 2))
            res.json({ success: true })
        } else {
            throw new Error('Relation not found')
        }
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
    console.log('[API] Finding entity and dictionary for:', entityName)
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    
    for (const dictionary of dictionaries) {
        const filePath = path.join(dictionary.filePath, dictionary.fileName)
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
        const entity = data.entities.find(e => e.name === entityName)
        
        if (entity) {
            console.log('[API] Found entity:', entityName)
            return { dictionary: data, entity, filePath }
        }
    }
    
    throw new Error('Entity not found')
}

// Функция для расчета связей сущности
function calculateRelations(entity, allEntities) {
    console.log('[API] Calculating relations for entity:', entity.name)
    console.log('[API] Current relations:', entity.relations)
    
    const relations = {}
    
    // Добавляем связи от reference полей
    const referenceFields = entity.fields
        .filter(field => field.parent && field.type === 'reference')
    
    console.log('[API] Reference fields found:', referenceFields.length)
    
    referenceFields.forEach(field => {
        const baseName = field.name.endsWith('Id') ? field.name.slice(0, -2) : field.name
        const relationName = baseName.charAt(0).toLowerCase() + baseName.slice(1)
        
        relations[relationName] = {
            type: 'belongsTo',
            target: field.parent,
            foreignKey: field.name,
            restriction: field.restriction || 'restrict'
        }
        
        console.log('[API] Added belongsTo relation:', {
            name: relationName,
            field: field.name,
            target: field.parent
        })
    })

    // Добавляем связи от references полей
    const referencesFields = entity.fields
        .filter(field => field.parent && field.type === 'references')
    
    console.log('[API] References fields found:', referencesFields.length)
    
    referencesFields.forEach(field => {
        const baseName = field.name.endsWith('Ids') ? field.name.slice(0, -3) : field.name
        const relationName = baseName.charAt(0).toLowerCase() + baseName.slice(1) + 's'
        
        relations[relationName] = {
            type: 'belongsToMany',
            target: field.parent,
            foreignKey: field.name,
            restriction: field.restriction || 'restrict'
        }
        
        console.log('[API] Added belongsToMany relation:', {
            name: relationName,
            field: field.name,
            target: field.parent
        })
    })

    // Добавляем обратные связи
    console.log('[API] Checking reverse relations from other entities:', allEntities.length)
    
    allEntities.forEach(childEntity => {
        if (childEntity.name === entity.name) return

        const reverseFields = childEntity.fields
            .filter(field => field.parent === entity.name && field.type === 'reference')
        
        if (reverseFields.length > 0) {
            console.log('[API] Found reverse relations from:', {
                entity: childEntity.name,
                fields: reverseFields.map(f => f.name)
            })
        }

        reverseFields.forEach(field => {
            let relationName = childEntity.name
            
            if (relations[relationName]) {
                const fieldBaseName = field.name.endsWith('Id') ? 
                    field.name.slice(0, -2) : field.name
                relationName = `${childEntity.name}${fieldBaseName.charAt(0).toUpperCase()}${fieldBaseName.slice(1)}`
            }

            relations[relationName] = {
                type: 'hasMany',
                target: childEntity.name,
                foreignKey: field.name,
                restriction: field.restriction || 'restrict'
            }
            
            console.log('[API] Added hasMany relation:', {
                name: relationName,
                field: field.name,
                target: childEntity.name
            })
        })
    })

    console.log('[API] Final relations:', relations)
    return relations
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
