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

// API для словарей
app.get('/api/dictionaries/meta', async (req, res) => {
  console.log('[API] Loading dictionaries metadata')
  console.log('[API] Request headers:', req.headers)
  console.log('[API] META_FILE path:', META_FILE)
  try {
    const exists = await fs.access(META_FILE).then(() => true).catch(() => false)
    console.log('[API] META_FILE exists:', exists)
    
    const data = await fs.readFile(META_FILE, 'utf8')
    console.log('[API] Raw data:', data)
    
    const parsed = JSON.parse(data)
    console.log('[API] Successfully loaded dictionaries metadata:', parsed)
    res.json(parsed)
  } catch (error) {
    console.error('[API] Error loading dictionaries metadata:', error)
    console.error('[API] Error stack:', error.stack)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  console.log(`[API] Loading dictionary: ${id}`)
  
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const dictionary = dictionaries.find(d => d.id === id)
    
    if (!dictionary) {
      throw new Error('Dictionary not found')
    }

    const filePath = path.join(dictionary.filePath, dictionary.fileName)
    const data = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(data)
    
    console.log(`[API] Successfully loaded dictionary ${id}:`, parsed)
    res.json(parsed)
  } catch (error) {
    console.error(`[API] Error reading dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// ... остальные API endpoints для словарей ...

// Добавление нового словаря
app.post('/api/dictionaries', async (req, res) => {
  const dictionaryData = req.body
  console.log(`[API] Adding new dictionary:`, dictionaryData)
  
  try {
    // Генерируем id для нового словаря
    const newDictionary = {
      ...dictionaryData,
      id: `dict_${uuidv4()}`
    }

    // Читаем текущие метаданные
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    // Добавляем новый словарь
    data.dictionaries.push(newDictionary)
    
    // Сохраняем обновленные метаданные
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    // Создаем пустой файл словаря
    const filePath = path.join(newDictionary.filePath, newDictionary.fileName)
    await fs.writeFile(filePath, JSON.stringify({ collections: [] }, null, 2))
    
    console.log(`[API] Successfully added dictionary:`, newDictionary)
    res.json(newDictionary)
  } catch (error) {
    console.error(`[API] Error adding dictionary:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Обновление словаря
app.put('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  const dictionaryData = req.body
  console.log(`[API] Updating dictionary: ${id}`)
  
  try {
    // Читаем текущие метаданные
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    // Находим индекс обновляемого словаря
    const index = data.dictionaries.findIndex(d => d.id === id)
    if (index === -1) {
      throw new Error('Dictionary not found')
    }

    // Получаем старые данные словаря
    const oldDictionary = data.dictionaries[index]
    
    // Если путь или имя файла изменились, перемещаем файл
    if (oldDictionary.filePath !== dictionaryData.filePath || 
        oldDictionary.fileName !== dictionaryData.fileName) {
      const oldPath = path.join(oldDictionary.filePath, oldDictionary.fileName)
      const newPath = path.join(dictionaryData.filePath, dictionaryData.fileName)
      
      // Копируем содержимое в новый ��йл
      const content = await fs.readFile(oldPath, 'utf8')
      await fs.writeFile(newPath, content)
    }

    // Обновляем метаданные
    data.dictionaries[index] = {
      ...oldDictionary,
      ...dictionaryData,
      id // Сохраняем оригинальный id
    }
    
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    console.log(`[API] Successfully updated dictionary ${id}`)
    res.json(data.dictionaries[index])
  } catch (error) {
    console.error(`[API] Error updating dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Удаление словаря
app.delete('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  console.log(`[API] Deleting dictionary: ${id}`)
  
  try {
    // Читаем текущие метаданные
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    // Удаляем словарь из метаданных
    data.dictionaries = data.dictionaries.filter(d => d.id !== id)
    
    // Сохраняем обновленные метаданные
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    console.log(`[API] Successfully deleted dictionary ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error deleting dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Сохранение данных словаря
app.post('/api/dictionaries/:id/data', async (req, res) => {
  const { id } = req.params
  const { data: dictionaryData } = req.body
  console.log(`[API] Saving dictionary data: ${id}`)
  
  try {
    // Получаем метаданные словаря
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const dictionary = dictionaries.find(d => d.id === id)
    
    if (!dictionary) {
      throw new Error('Dictionary not found')
    }

    // Сохраняем данные в файл
    const filePath = path.join(dictionary.filePath, dictionary.fileName)
    await fs.writeFile(filePath, JSON.stringify(dictionaryData, null, 2))
    
    console.log(`[API] Successfully saved dictionary data ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error saving dictionary data ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// API для работы с файловой системой
app.get('/api/filesystem/directories', async (req, res) => {
  console.log('[API] Getting directories list')
  try {
    // Получаем список предопределенных каталогов
    const baseDir = path.join(__dirname)
    const publicDir = path.join(__dirname, 'public')
    
    const directories = [
      {
        label: 'Schemas',
        value: path.join(baseDir, 'schemas'),
      },
      {
        label: 'Public Schemas',
        value: path.join(publicDir, 'schemas'),
      }
    ]

    // Проверяем существование каталогов
    for (const dir of directories) {
      try {
        await fs.access(dir.value)
      } catch {
        // Если каталог не существует, создаем его
        await fs.mkdir(dir.value, { recursive: true })
      }
    }

    console.log('[API] Available directories:', directories)
    res.json(directories)
  } catch (error) {
    console.error('[API] Error getting directories:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/filesystem/files', async (req, res) => {
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
            label: file,
            value: file,
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

// Вспомогательная функция для форматирования размера файла
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Добавляем новые endpoints для работы с системными диалогами
// Удаляем неиспользуемый код Electron
// const { dialog } = require('electron').remote // Удаляем эту строку

// Изменяем API endpoints для работы с файловой системой
app.post('/api/filesystem/select-directory', async (req, res) => {
  try {
    // Возвращаем список доступных каталогов
    const directories = [
      {
        label: 'Schemas',
        value: path.join(__dirname, 'schemas'),
      },
      {
        label: 'Public Schemas',
        value: path.join(__dirname, 'public', 'schemas'),
      }
    ]

    // Проверяем и создаем каталоги если их нет
    for (const dir of directories) {
      await fs.mkdir(dir.value, { recursive: true })
    }

    res.json(directories)
  } catch (error) {
    console.error('[API] Error getting directories:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/filesystem/select-file', async (req, res) => {
  const { directory } = req.body
  
  try {
    const files = await fs.readdir(directory)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const fileInfos = await Promise.all(
      jsonFiles.map(async file => {
        const filePath = path.join(directory, file)
        const stats = await fs.stat(filePath)
        return {
          name: file,
          path: filePath,
          size: formatFileSize(stats.size),
          modified: stats.mtime.toLocaleString()
        }
      })
    )
    
    res.json(fileInfos)
  } catch (error) {
    console.error('[API] Error getting files:', error)
    res.status(500).json({ error: error.message })
  }
})

// Initialize data and start server
async function initializeData() {
  console.log('[Init] Starting data initialization')
  try {
    await fs.mkdir(SCHEMAS_DIR, { recursive: true })
    await fs.mkdir(BACKUPS_DIR, { recursive: true })
    console.log('[Init] Directories created')

    // Проверяем/создаем meta-файл
    try {
      await fs.access(META_FILE)
      console.log('[Init] Meta file exists')
    } catch {
      console.log('[Init] Creating meta file')
      await fs.writeFile(META_FILE, JSON.stringify({
        dictionaries: []  // Пустой массив словарей
      }, null, 2))
    }

    console.log('[Init] Data initialization completed')
  } catch (error) {
    console.error('[Init] Error initializing data:', error)
  }
}

// Start server
initializeData().then(() => {
  const port = process.env.PORT || 3001  // Меняем на 3001 или другой свободный порт
  app.listen(port, () => {
    console.log('='.repeat(50))
    console.log(`[Server] API server running on port ${port}`)
    console.log(`[Server] Meta file path: ${META_FILE}`)
    console.log(`[Server] Schemas directory: ${SCHEMAS_DIR}`)
    console.log(`[Server] Available endpoints:`)
    console.log(`[Server] - GET /api/dictionaries/meta`)
    console.log(`[Server] - GET /api/dictionaries/:id`)
    console.log(`[Server] - POST /api/dictionaries`)
    console.log(`[Server] - PUT /api/dictionaries/:id`)
    console.log(`[Server] - DELETE /api/dictionaries/:id`)
    console.log('='.repeat(50))
  })
})

// ... остальной код ...
