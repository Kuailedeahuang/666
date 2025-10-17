import express from 'express'
import { supabase } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// 获取用户收藏列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: favorites, error, count } = await supabase
      .from('favorites')
      .select(`
        id,
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
      favorite_id: fav.id,
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
    console.error('获取收藏列表错误:', error)
    res.status(500).json({
      error: '获取收藏列表失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 添加收藏
router.post('/:poemId', authenticateToken, async (req, res) => {
  try {
    const poemId = req.params.poemId

    // 检查诗词是否存在
    const { data: poem, error: checkError } = await supabase
      .from('poems')
      .select('id')
      .eq('id', poemId)
      .eq('status', 'published')
      .single()

    if (checkError) {
      return res.status(404).json({
        error: '诗词不存在',
        message: '未找到指定的诗词'
      })
    }

    // 检查是否已经收藏
    const { data: existingFavorite, error: favoriteCheckError } = await supabase
      .from('favorites')
      .select('id')
      .eq('poem_id', poemId)
      .eq('user_id', req.user.id)
      .single()

    if (favoriteCheckError && favoriteCheckError.code !== 'PGRST116') {
      throw favoriteCheckError
    }

    if (existingFavorite) {
      return res.status(409).json({
        error: '已收藏',
        message: '该诗词已经在您的收藏列表中'
      })
    }

    // 添加收藏
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({
        poem_id: poemId,
        user_id: req.user.id,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        poem:poems(
          *,
          user:users(username, avatar)
        ),
        created_at
      `)
      .single()

    if (error) throw error

    res.status(201).json({
      message: '收藏成功',
      favorite: {
        id: favorite.id,
        poem: favorite.poem,
        created_at: favorite.created_at
      }
    })

  } catch (error) {
    console.error('添加收藏错误:', error)
    res.status(500).json({
      error: '添加收藏失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 取消收藏
router.delete('/:poemId', authenticateToken, async (req, res) => {
  try {
    const poemId = req.params.poemId

    // 查找收藏记录
    const { data: favorite, error: findError } = await supabase
      .from('favorites')
      .select('id')
      .eq('poem_id', poemId)
      .eq('user_id', req.user.id)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        return res.status(404).json({
          error: '收藏记录不存在',
          message: '未找到指定的收藏记录'
        })
      }
      throw findError
    }

    // 删除收藏记录
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favorite.id)

    if (deleteError) throw deleteError

    res.json({
      message: '取消收藏成功',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('取消收藏错误:', error)
    res.status(500).json({
      error: '取消收藏失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 检查是否已收藏
router.get('/:poemId/check', authenticateToken, async (req, res) => {
  try {
    const poemId = req.params.poemId

    const { data: favorite, error } = await supabase
      .from('favorites')
      .select('id, created_at')
      .eq('poem_id', poemId)
      .eq('user_id', req.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    res.json({
      is_favorited: !!favorite,
      favorite_id: favorite?.id,
      favorited_at: favorite?.created_at
    })

  } catch (error) {
    console.error('检查收藏状态错误:', error)
    res.status(500).json({
      error: '检查收藏状态失败',
      message: error.message || '服务器内部错误'
    })
  }
})

export default router