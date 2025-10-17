import jwt from 'jsonwebtoken'
import { supabase } from '../config/database.js'

// JWT验证中间件
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: '访问令牌缺失',
        message: '请提供有效的JWT令牌'
      })
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 从Supabase验证用户存在
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role, status')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(401).json({
        error: '用户不存在',
        message: '令牌对应的用户不存在'
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: '账户被禁用',
        message: '您的账户已被禁用，请联系管理员'
      })
    }

    // 将用户信息添加到请求对象
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '无效令牌',
        message: '提供的JWT令牌无效'
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '令牌已过期',
        message: 'JWT令牌已过期，请重新登录'
      })
    }

    console.error('认证中间件错误:', error)
    return res.status(500).json({
      error: '认证失败',
      message: '服务器认证过程出错'
    })
  }
}

// 角色授权中间件
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: '未认证',
        message: '需要先进行用户认证'
      })
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: '权限不足',
        message: `需要角色: ${allowedRoles.join(', ')}, 当前角色: ${userRole}`
      })
    }

    next()
  }
}

// 生成JWT令牌
export const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// 刷新令牌中间件
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        error: '令牌缺失',
        message: '需要提供刷新令牌'
      })
    }

    // 验证旧令牌（允许过期令牌）
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true })
    
    // 检查用户是否存在
    const { data: user, error } = await supabase
      .from('users')
      .select('id, status')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(401).json({
        error: '用户不存在',
        message: '无法刷新不存在的用户令牌'
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: '账户被禁用',
        message: '无法刷新被禁用账户的令牌'
      })
    }

    // 生成新令牌
    const newToken = generateToken(user.id)

    return res.json({
      message: '令牌刷新成功',
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })

  } catch (error) {
    console.error('刷新令牌错误:', error)
    return res.status(401).json({
      error: '刷新失败',
      message: '令牌刷新过程出错'
    })
  }
}

export default {
  authenticateToken,
  requireRole,
  generateToken,
  refreshToken
}