import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

// 导入路由
import authRoutes from './routes/auth.js'
import poetryRoutes from './routes/poetry.js'
import userRoutes from './routes/users.js'
import analysisRoutes from './routes/analysis.js'
import favoritesRoutes from './routes/favorites.js'
import databaseRoutes from './routes/database.js'
import aiChatRoutes from './routes/ai-chat.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 安全中间件
app.use(helmet())
app.use(compression())

// 日志中间件
app.use(morgan('combined'))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP每15分钟最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: 900 // 15分钟后重试
  }
})
app.use(limiter)

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// 解析JSON和URL编码数据（修复中文字符问题）
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json',
  charset: 'utf-8'
}))
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}))

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/poetry', poetryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/database', databaseRoutes)
app.use('/api/ai-chat', aiChatRoutes)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method
  })
})

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error)
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: '请求数据验证失败',
      details: error.details
    })
  }
  
  if (error.code === '23505') { // PostgreSQL唯一约束违反
    return res.status(409).json({
      error: '数据已存在',
      field: error.constraint
    })
  }
  
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 诗歌赏析后端服务器运行在端口 ${PORT}`)
  console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 健康检查: http://localhost:${PORT}/health`)
})

export default app