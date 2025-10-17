import express from 'express'
import { supabase } from '../config/database.js'

const router = express.Router()

// 数据库初始化端点（仅开发环境可用）
router.post('/init', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        error: '此功能仅在开发环境中可用'
      })
    }

    console.log('开始初始化数据库...')

    // 创建示例数据
    const samplePoems = [
      {
        title: '静夜思',
        author: '李白',
        dynasty: '唐',
        content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
        tags: ['思乡', '月亮', '夜晚']
      },
      {
        title: '春晓',
        author: '孟浩然',
        dynasty: '唐',
        content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
        tags: ['春天', '自然', '生活']
      },
      {
        title: '登鹳雀楼',
        author: '王之涣',
        dynasty: '唐',
        content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
        tags: ['登高', '壮丽', '哲理']
      },
      {
        title: '水调歌头',
        author: '苏轼',
        dynasty: '宋',
        content: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。',
        tags: ['中秋', '思念', '月亮']
      },
      {
        title: '声声慢',
        author: '李清照',
        dynasty: '宋',
        content: '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。',
        tags: ['忧愁', '秋天', '思念']
      }
    ]

    // 插入示例数据
    const results = []
    for (const poem of samplePoems) {
      const { data, error } = await supabase
        .from('poems')
        .insert(poem)
        .select()

      if (error) {
        console.error(`插入诗词失败: ${poem.title}`, error)
        results.push({ title: poem.title, status: 'failed', error: error.message })
      } else {
        console.log(`插入诗词成功: ${poem.title}`)
        results.push({ title: poem.title, status: 'success', id: data[0].id })
      }
    }

    res.json({
      message: '数据库初始化完成',
      results,
      total: samplePoems.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    })

  } catch (error) {
    console.error('数据库初始化错误:', error)
    res.status(500).json({
      error: '数据库初始化失败',
      message: error.message
    })
  }
})

// 检查数据库连接状态
router.get('/status', async (req, res) => {
  try {
    // 测试数据库连接
    const { data, error } = await supabase
      .from('poems')
      .select('id')
      .limit(1)

    if (error) {
      return res.json({
        status: 'error',
        message: '数据库连接失败',
        error: error.message
      })
    }

    res.json({
      status: 'connected',
      message: '数据库连接正常',
      tables: ['poems'] // 假设表存在
    })

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '数据库检查失败',
      error: error.message
    })
  }
})

export default router