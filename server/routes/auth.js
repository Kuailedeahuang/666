import express from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/database.js'
import { generateToken, authenticateToken } from '../middleware/auth.js'
import { validate, authSchemas } from '../middleware/validation.js'

const router = express.Router()

// 用户注册
router.post('/register', validate(authSchemas.register), async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 检查用户是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)

    if (checkError) throw checkError

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({
        error: '用户已存在',
        message: '邮箱或用户名已被注册'
      })
    }

    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, username, email, role, created_at')
      .single()

    if (createError) throw createError

    // 生成JWT令牌
    const token = generateToken(user.id)

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })

  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      error: '注册失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 用户登录
router.post('/login', validate(authSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body

    // 查找用户
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username, email, password, role, status')
      .eq('email', email)
      .single()

    if (findError || !user) {
      return res.status(401).json({
        error: '认证失败',
        message: '邮箱或密码错误'
      })
    }

    // 检查账户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        error: '账户被禁用',
        message: '您的账户已被禁用，请联系管理员'
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: '认证失败',
        message: '邮箱或密码错误'
      })
    }

    // 生成JWT令牌
    const token = generateToken(user.id)

    // 更新最后登录时间
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })

  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      error: '登录失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, bio, avatar, created_at, last_login')
      .eq('id', req.user.id)
      .single()

    if (error) throw error

    res.json({
      user: {
        ...user,
        // 统计用户数据
        stats: await getUserStats(req.user.id)
      }
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      error: '获取用户信息失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: '参数缺失',
        message: '当前密码和新密码都是必填项'
      })
    }

    // 获取当前用户密码
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single()

    if (findError) throw findError

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: '密码错误',
        message: '当前密码不正确'
      })
    }

    // 加密新密码
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)

    if (updateError) throw updateError

    res.json({
      message: '密码修改成功',
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('修改密码错误:', error)
    res.status(500).json({
      error: '修改密码失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 退出登录（客户端处理令牌失效）
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: '退出登录成功',
    timestamp: new Date().toISOString()
  })
})

// 辅助函数：获取用户统计信息
async function getUserStats(userId) {
  try {
    // 获取用户创建的诗词数量
    const { count: poemsCount } = await supabase
      .from('poems')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 获取用户收藏的诗词数量
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 获取用户获得的点赞数量
    const { count: likesCount } = await supabase
      .from('poem_likes')
      .select('*', { count: 'exact', head: true })
      .eq('poem_user_id', userId)

    return {
      poems: poemsCount || 0,
      favorites: favoritesCount || 0,
      likes: likesCount || 0
    }
  } catch (error) {
    console.error('获取用户统计信息错误:', error)
    return { poems: 0, favorites: 0, likes: 0 }
  }
}

export default router