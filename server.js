const express = require('express')
const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')
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

// Static files
app.use('/schemas', express.static(SCHEMAS_DIR))

// API routes
app.get('/api/schemas/dictionaries', async (req, res) => {
  console.log('[API] Loading dictionaries')
  try {
    console.log('[API] Reading file:', path.join(SCHEMAS_DIR, 'dictionaries.json'))
    const data = await fs.readFile(path.join(SCHEMAS_DIR, 'dictionaries.json'), 'utf8')
    const parsed = JSON.parse(data)
    console.log('[API] Successfully loaded dictionaries:', parsed)
    res.json(parsed)
  } catch (error) {
    console.error('[API] Error loading dictionaries:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/schemas/:name', async (req, res) => {
  const { name } = req.params
  console.log(`[API] Loading schema: ${name}`)
  
  try {
    if (!name || typeof name !== 'string') {
      console.error('[API] Invalid schema name:', name)
      throw new Error('Invalid schema name')
    }
    
    const decodedName = decodeURIComponent(name)
    console.log('[API] Decoded name:', decodedName)
    
    const schemaPath = path.join(SCHEMAS_DIR, `${decodedName}.json`)
    console.log(`[API] Reading schema file: ${schemaPath}`)
    
    const data = await fs.readFile(schemaPath, 'utf8')
    const parsed = JSON.parse(data)
    console.log(`[API] Successfully loaded schema ${decodedName}:`, parsed)
    
    res.json(parsed)
  } catch (error) {
    console.error(`[API] Error reading schema ${name}:`, error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/schemas/:name', async (req, res) => {
  const { name } = req.params
  console.log(`[API] Saving schema: ${name}`)
  
  try {
    const decodedName = decodeURIComponent(name)
    console.log('[API] Decoded name:', decodedName)
    
    const schemaPath = path.join(SCHEMAS_DIR, `${decodedName}.json`)
    console.log(`[API] Writing schema file: ${schemaPath}`)
    console.log('[API] Schema data:', req.body)
    
    await fs.writeFile(schemaPath, JSON.stringify(req.body, null, 2))
    console.log(`[API] Successfully saved schema ${decodedName}`)
    
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error saving schema ${name}:`, error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/schemas/backup/:name', async (req, res) => {
  const { name } = req.params
  console.log(`[API] Creating backup for: ${name}`)
  
  try {
    const decodedName = decodeURIComponent(name)
    console.log('[API] Decoded name:', decodedName)
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `${decodedName}_${timestamp}.json`
    const backupPath = path.join(BACKUPS_DIR, backupName)
    
    console.log(`[API] Writing backup file: ${backupPath}`)
    console.log('[API] Backup data:', req.body)
    
    await fs.writeFile(backupPath, JSON.stringify(req.body, null, 2))
    console.log(`[API] Successfully created backup ${backupName}`)
    
    res.json({ success: true, backupName })
  } catch (error) {
    console.error(`[API] Error creating backup for ${name}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'API сервер работает' })
})

// Initialize data and start server
async function initializeData() {
  console.log('[Init] Starting data initialization')
  try {
    await fs.mkdir(SCHEMAS_DIR, { recursive: true })
    await fs.mkdir(BACKUPS_DIR, { recursive: true })
    console.log('[Init] Directories created')

    const files = {
      'dictionaries.json': {
        'original': 'Оригинальный словарь',
        'new': 'Новый словарь'
      },
      'original.json': { collections: [] },
      'new.json': { collections: [] }
    }

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(SCHEMAS_DIR, filename)
      try {
        await fs.access(filePath)
        console.log(`[Init] File exists: ${filename}`)
      } catch {
        console.log(`[Init] Creating file: ${filename}`)
        await fs.writeFile(filePath, JSON.stringify(content, null, 2))
      }
    }
    console.log('[Init] Data initialization completed')
  } catch (error) {
    console.error('[Init] Error initializing data:', error)
  }
}

initializeData().then(() => {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`[Server] API server running on port ${port}`)
  })
})

// Обновленные API routes
app.get('/api/dictionaries/meta', async (req, res) => {
  console.log('[API] Loading dictionaries metadata')
  try {
    const data = await fs.readFile(META_FILE, 'utf8')
    const parsed = JSON.parse(data)
    console.log('[API] Successfully loaded dictionaries metadata:', parsed)
    res.json(parsed)
  } catch (error) {
    console.error('[API] Error loading dictionaries metadata:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  console.log(`[API] Loading dictionary: ${id}`)
  
  try {
    // Получаем метаданные словаря
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const { dictionaries } = JSON.parse(metaData)
    const dictionary = dictionaries.find(d => d.id === id)
    
    if (!dictionary) {
      throw new Error('Dictionary not found')
    }

    // Читаем файл словаря
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

app.post('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  const { data } = req.body
  console.log(`[API] Saving dictionary: ${id}`)
  
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
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    
    console.log(`[API] Successfully saved dictionary ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error saving dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Новые endpoints для работы с меаданными словарей
app.post('/api/dictionaries', async (req, res) => {
  const { name, fileName, filePath, description } = req.body
  console.log('[API] Adding new dictionary')
  
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    const newDictionary = {
      id: `dict_${uuidv4()}`,
      name,
      fileName,
      filePath,
      description
    }
    
    data.dictionaries.push(newDictionary)
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    console.log('[API] Successfully added new dictionary:', newDictionary)
    res.json(newDictionary)
  } catch (error) {
    console.error('[API] Error adding dictionary:', error)
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/dictionaries/:id', async (req, res) => {
  const { id } = req.params
  console.log(`[API] Deleting dictionary: ${id}`)
  
  try {
    const metaData = await fs.readFile(META_FILE, 'utf8')
    const data = JSON.parse(metaData)
    
    data.dictionaries = data.dictionaries.filter(d => d.id !== id)
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    console.log(`[API] Successfully deleted dictionary ${id}`)
    res.json({ success: true })
  } catch (error) {
    console.error(`[API] Error deleting dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})

// Импортируем дополнительные модули для работы с файловой системой
const util = require('util')
const exec = util.promisify(require('child_process').exec)

// API для работы с файловой системой
app.get('/api/filesystem/directories', async (req, res) => {
  console.log('[API] Getting directories list')
  try {
    let command
    if (process.platform === 'win32') {
      // Для Windows
      command = 'dir /AD /B'
    } else {
      // Для Unix-подобных систем
      command = 'find / -type d -maxdepth 3 2>/dev/null'
    }

    const { stdout } = await exec(command)
    const directories = stdout
      .split('\n')
      .filter(Boolean)
      .filter(dir => !dir.startsWith('.'))
      .map(dir => ({
        label: dir,
        value: dir
      }))

    console.log('[API] Found directories:', directories.length)
    res.json(directories)
  } catch (error) {
    console.error('[API] Error getting directories:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/filesystem/files', async (req, res) => {
  const { path: dirPath } = req.query
  console.log('[API] Getting files list for path:', dirPath)

  try {
    if (!dirPath) {
      throw new Error('Path is required')
    }

    // Проверяем существование директории
    await fs.access(dirPath)

    // Читаем содержимое директории
    const files = await fs.readdir(dirPath)
    
    // Получаем информацию о каждом файле
    const fileStats = await Promise.all(
      files.map(async file => {
        const filePath = path.join(dirPath, file)
        const stats = await fs.stat(filePath)
        return {
          name: file,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        }
      })
    )

    // Фильтруем только файлы (не директории) и форматируем для выпадающего списка
    const fileOptions = fileStats
      .filter(file => !file.isDirectory)
      .map(file => ({
        label: `${file.name} (${formatFileSize(file.size)})`,
        value: file.name,
        ...file
      }))

    console.log('[API] Found files:', fileOptions.length)
    res.json(fileOptions)
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

// Проверка доступности пути
app.get('/api/filesystem/check-path', async (req, res) => {
  const { path: checkPath } = req.query
  console.log('[API] Checking path:', checkPath)

  try {
    if (!checkPath) {
      throw new Error('Path is required')
    }

    await fs.access(checkPath)
    const stats = await fs.stat(checkPath)
    
    res.json({
      exists: true,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      size: stats.size,
      modified: stats.mtime
    })
  } catch (error) {
    console.error('[API] Error checking path:', error)
    res.json({
      exists: false,
      error: error.message
    })
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

    // Проверяем доступность нового пути/файла
    const newPath = path.join(dictionaryData.filePath, dictionaryData.fileName)
    try {
      await fs.access(newPath)
    } catch {
      // Если файл не существует, создаем пустой словарь
      await fs.writeFile(newPath, JSON.stringify({ collections: [] }, null, 2))
    }

    // Если путь или имя файла изменились, копируем данные
    const oldDict = data.dictionaries[index]
    if (oldDict.filePath !== dictionaryData.filePath || 
        oldDict.fileName !== dictionaryData.fileName) {
      const oldPath = path.join(oldDict.filePath, oldDict.fileName)
      try {
        const content = await fs.readFile(oldPath, 'utf8')
        await fs.writeFile(newPath, content)
      } catch (error) {
        console.warn(`[API] Could not copy dictionary data: ${error.message}`)
      }
    }

    // Обновляем метаданные
    data.dictionaries[index] = {
      ...data.dictionaries[index],
      ...dictionaryData
    }
    
    await fs.writeFile(META_FILE, JSON.stringify(data, null, 2))
    
    console.log(`[API] Successfully updated dictionary ${id}`)
    res.json(data.dictionaries[index])
  } catch (error) {
    console.error(`[API] Error updating dictionary ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
})
