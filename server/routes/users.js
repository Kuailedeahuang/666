import express from 'express'
import { supabase } from '../config/database.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { validate, authSchemas } from '../middleware/validation.js'

const router = express.Router()

// 获取用户个人资料
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        role,
        bio,
        avatar,
        created_at,
        last_login,
        poems:poems(count),
        favorites:favorites(count),
        received_likes:poem_likes(count)
      `)
      .eq('id', req.user.id)
      .single()

    if (error) throw error

    res.json({
      user: {
        ...user,
        // 计算统计数据
        stats: {
          poems: user.poems?.[0]?.count || 0,
          favorites: user.favorites?.[0]?.count || 0,
          receivedLikes: user.received_likes?.[0]?.count || 0
        }
      }
    })

  } catch (error) {
    console.error('获取用户资料错误:', error)
    res.status(500).json({
      error: '获取用户资料失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 更新用户个人资料
router.put('/profile', authenticateToken, validate(authSchemas.updateProfile), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, username, email, role, bio, avatar, updated_at')
      .single()

    if (error) throw error

    res.json({
      message: '个人资料更新成功',
      user
    })

  } catch (error) {
    console.error('更新用户资料错误:', error)
    res.status(500).json({
      error: '更新个人资料失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取用户创建的诗词
router.get('/poems', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: poems, error, count } = await supabase
      .from('poems')
      .select(`
        *,
        likes:poem_likes(count),
        comments:poem_comments(count)
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      poems: poems || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取用户诗词错误:', error)
    res.status(500).json({
      error: '获取用户诗词失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取用户收藏的诗词
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: favorites, error, count } = await supabase
      .from('favorites')
      .select(`
        poem:poems(
          *,
          user:users(username, avatar),
          likes:poem_likes(count),
          comments:poem_comments(count)
        ),
        created_at
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const poems = favorites.map(fav => ({
      ...fav.poem,
      favorited_at: fav.created_at
    }))

    res.json({
      poems: poems || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取用户收藏错误:', error)
    res.status(500).json({
      error: '获取用户收藏失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取用户点赞的诗词
router.get('/likes', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: likes, error, count } = await supabase
      .from('poem_likes')
      .select(`
        poem:poems(
          *,
          user:users(username, avatar),
          likes:poem_likes(count),
          comments:poem_comments(count)
        ),
        created_at
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const poems = likes.map(like => ({
      ...like.poem,
      liked_at: like.created_at
    }))

    res.json({
      poems: poems || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取用户点赞错误:', error)
    res.status(500).json({
      error: '获取用户点赞失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 管理员功能：获取所有用户（仅管理员）
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        role,
        status,
        created_at,
        last_login,
        poems:poems(count),
        favorites:favorites(count)
      `)
      .neq('role', 'superadmin') // 不显示超级管理员

    // 搜索功能
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      users: users || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({
      error: '获取用户列表失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 管理员功能：更新用户状态（仅管理员）
router.put('/:userId/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params
    const { status } = req.body

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        error: '无效的状态',
        message: '状态必须是 active、suspended 或 banned'
      })
    }

    // 检查用户是否存在
    const { data: user, error: checkError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (checkError) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      })
    }

    // 不能修改管理员的状态
    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({
        error: '权限不足',
        message: '不能修改管理员账户的状态'
      })
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, username, email, role, status, updated_at')
      .single()

    if (error) throw error

    res.json({
      message: '用户状态更新成功',
      user: updatedUser
    })

  } catch (error) {
    console.error('更新用户状态错误:', error)
    res.status(500).json({
      error: '更新用户状态失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 管理员功能：删除用户（仅管理员）
router.delete('/:userId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params

    // 检查用户是否存在
    const { data: user, error: checkError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (checkError) {
      return res.status(404).json({
        error: '用户不存在',
        message: '未找到指定的用户'
      })
    }

    // 不能删除管理员
    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({
        error: '权限不足',
        message: '不能删除管理员账户'
      })
    }

    // 软删除用户（标记为删除状态）
    const { error } = await supabase
      .from('users')
      .update({ 
        status: 'deleted',
        email: `deleted_${Date.now()}@deleted.com`,
        username: `deleted_user_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    res.json({
      message: '用户删除成功',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('删除用户错误:', error)
    res.status(500).json({
      error: '删除用户失败',
      message: error.message || '服务器内部错误'
    })
  }
})

export default router