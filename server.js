const express = require('express')
const fs = require('fs').promises
const path = require('path')
const app = express()

app.use(express.json())

const SCHEMAS_DIR = path.join(__dirname, 'schemas')
const BACKUPS_DIR = path.join(SCHEMAS_DIR, 'backups')

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