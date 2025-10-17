import express from 'express'
import axios from 'axios'
import { supabase } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// AI诗词分析（使用OpenAI API）
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { poemId, analysisType = 'comprehensive' } = req.body

    if (!poemId) {
      return res.status(400).json({
        error: '参数缺失',
        message: '需要提供诗词ID'
      })
    }

    // 获取诗词内容
    const { data: poem, error: poemError } = await supabase
      .from('poems')
      .select('title, author, dynasty, content, translation, notes')
      .eq('id', poemId)
      .eq('status', 'published')
      .single()

    if (poemError) {
      return res.status(404).json({
        error: '诗词不存在',
        message: '未找到指定的诗词'
      })
    }

    // 检查是否有可用的AI服务
    const openaiApiKey = process.env.OPENAI_API_KEY
    const baiduApiKey = process.env.BAIDU_AI_API_KEY
    const baiduSecretKey = process.env.BAIDU_AI_SECRET_KEY

    let analysisResult = null

    // 优先使用OpenAI
    if (openaiApiKey) {
      analysisResult = await analyzeWithOpenAI(poem, analysisType, openaiApiKey)
    } 
    // 其次使用百度AI
    else if (baiduApiKey && baiduSecretKey) {
      analysisResult = await analyzeWithBaiduAI(poem, analysisType, baiduApiKey, baiduSecretKey)
    }
    // 如果没有AI服务，使用内置分析
    else {
      analysisResult = await analyzeWithBuiltIn(poem, analysisType)
    }

    // 保存分析结果到数据库
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('poem_analyses')
      .insert({
        poem_id: poemId,
        user_id: req.user.id,
        analysis_type: analysisType,
        content: analysisResult,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('保存分析结果错误:', saveError)
      // 不返回错误，仍然返回分析结果
    }

    res.json({
      message: '诗词分析完成',
      analysis: analysisResult,
      analysis_id: savedAnalysis?.id,
      used_ai: !!(openaiApiKey || (baiduApiKey && baiduSecretKey))
    })

  } catch (error) {
    console.error('诗词分析错误:', error)
    res.status(500).json({
      error: '诗词分析失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取诗词的分析历史
router.get('/:poemId/history', authenticateToken, async (req, res) => {
  try {
    const poemId = req.params.poemId
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const { data: analyses, error, count } = await supabase
      .from('poem_analyses')
      .select(`
        *,
        user:users(username, avatar)
      `)
      .eq('poem_id', poemId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      analyses: analyses || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('获取分析历史错误:', error)
    res.status(500).json({
      error: '获取分析历史失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取特定分析结果
router.get('/:analysisId', authenticateToken, async (req, res) => {
  try {
    const analysisId = req.params.analysisId

    const { data: analysis, error } = await supabase
      .from('poem_analyses')
      .select(`
        *,
        user:users(username, avatar),
        poem:poems(title, author, dynasty, content)
      `)
      .eq('id', analysisId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: '分析记录不存在',
          message: '未找到指定的分析记录'
        })
      }
      throw error
    }

    // 检查权限（只能查看自己或公开的分析）
    if (analysis.user_id !== req.user.id && analysis.is_public === false) {
      return res.status(403).json({
        error: '权限不足',
        message: '没有权限查看此分析记录'
      })
    }

    res.json({
      analysis
    })

  } catch (error) {
    console.error('获取分析结果错误:', error)
    res.status(500).json({
      error: '获取分析结果失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 删除分析记录
router.delete('/:analysisId', authenticateToken, async (req, res) => {
  try {
    const analysisId = req.params.analysisId

    // 检查分析记录是否存在且属于当前用户
    const { data: analysis, error: checkError } = await supabase
      .from('poem_analyses')
      .select('user_id')
      .eq('id', analysisId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: '分析记录不存在',
          message: '未找到指定的分析记录'
        })
      }
      throw checkError
    }

    if (analysis.user_id !== req.user.id) {
      return res.status(403).json({
        error: '权限不足',
        message: '只能删除自己的分析记录'
      })
    }

    const { error: deleteError } = await supabase
      .from('poem_analyses')
      .delete()
      .eq('id', analysisId)

    if (deleteError) throw deleteError

    res.json({
      message: '分析记录删除成功',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('删除分析记录错误:', error)
    res.status(500).json({
      error: '删除分析记录失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// AI分析函数
async function analyzeWithOpenAI(poem, analysisType, apiKey) {
  try {
    const prompt = buildAnalysisPrompt(poem, analysisType)
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的诗词赏析专家，擅长从多个角度分析古典诗词。请用中文回答。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('OpenAI分析错误:', error)
    throw new Error('AI分析服务暂时不可用')
  }
}

async function analyzeWithBaiduAI(poem, analysisType, apiKey, secretKey) {
  try {
    // 获取百度AI访问令牌
    const tokenResponse = await axios.post(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
    )
    
    const accessToken = tokenResponse.data.access_token
    
    const prompt = buildAnalysisPrompt(poem, analysisType)
    
    const response = await axios.post('https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant', {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, {
      params: {
        access_token: accessToken
      }
    })

    return response.data.result
  } catch (error) {
    console.error('百度AI分析错误:', error)
    throw new Error('AI分析服务暂时不可用')
  }
}

async function analyzeWithBuiltIn(poem, analysisType) {
  // 简单的内置分析逻辑
  const { title, author, dynasty, content } = poem
  
  const analysisTemplates = {
    comprehensive: `《${title}》是${dynasty}代诗人${author}的作品。这首诗通过精炼的语言表达了深刻的情感。诗词内容为："${content}"。从整体来看，这首诗展现了${author}独特的艺术风格和情感表达。`,
    theme: `《${title}》的主题集中在情感表达和意境营造上。诗人通过细腻的描写，展现了特定的情感氛围。`,
    technique: `在艺术手法上，${author}运用了传统的诗词技巧，包括对仗、押韵等手法，增强了诗歌的音乐性和节奏感。`,
    language: `语言方面，这首诗用词精准，意象鲜明，展现了古典诗词的语言魅力。`
  }

  return analysisTemplates[analysisType] || analysisTemplates.comprehensive
}

function buildAnalysisPrompt(poem, analysisType) {
  const { title, author, dynasty, content, translation, notes } = poem
  
  const analysisPrompts = {
    comprehensive: `请对以下诗词进行全面的赏析：
标题：《${title}》
作者：${author}（${dynasty}代）
内容：${content}
${translation ? `译文：${translation}` : ''}
${notes ? `注释：${notes}` : ''}

请从主题思想、艺术特色、语言风格、历史背景等方面进行全面分析。`,
    
    theme: `请分析以下诗词的主题思想：
《${title}》- ${author}
${content}

重点分析诗歌表达的核心主题和情感。`,
    
    technique: `请分析以下诗词的艺术手法：
《${title}》- ${author}
${content}

重点分析诗歌运用的修辞手法、结构特点等艺术技巧。`,
    
    language: `请分析以下诗词的语言特色：
《${title}》- ${author}
${content}

重点分析诗歌的语言风格、用词特点等。`
  }

  return analysisPrompts[analysisType] || analysisPrompts.comprehensive
}

export default router