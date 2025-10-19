import express from 'express'
import { supabase } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'
import { validate, poetrySchemas, paginationSchema } from '../middleware/validation.js'

const router = express.Router()

// 获取诗词列表（支持分页、搜索、过滤）
router.get('/', validate(paginationSchema, { query: true }), async (req, res) => {
  try {
    // 手动解析URL参数，因为Express.js可能没有正确解析中文参数
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    const queryParams = Object.fromEntries(parsedUrl.searchParams)
    
    let { page, limit, sort, order, dynasty, author, tags, category } = queryParams
    
    // 确保分页参数是数字类型
    page = parseInt(page) || 1
    limit = parseInt(limit) || 20
    const offset = (page - 1) * limit
    
    // 调试：查看原始查询参数
    console.log(`原始查询参数:`, queryParams)
    console.log(`原始URL: ${req.url}`)
    
    // URL解码参数（如果参数已经被编码）
    if (dynasty) {
      // 检查参数是否已经被自动解码
      const originalDynasty = dynasty
      try {
        dynasty = decodeURIComponent(dynasty)
        console.log(`解码后的朝代参数: "${dynasty}" (原始: "${originalDynasty}")`)
      } catch (e) {
        console.log(`参数已经是解码状态: "${dynasty}"`)
      }
    }
    if (author) author = decodeURIComponent(author)
    if (tags) tags = decodeURIComponent(tags)
    if (category) category = decodeURIComponent(category)

    // 尝试从数据库获取数据
    try {
      let query = supabase
        .from('poems')
        .select(`
          *,
          user:users(username, avatar_url),
          likes:poem_likes(count),
          comments:poem_comments(count)
        `, { count: 'exact' })
        .eq('status', 'published')

      // 朝代过滤
      if (dynasty && dynasty !== '全部') {
        console.log(`应用朝代过滤: ${dynasty}`)
        query = query.eq('dynasty', dynasty)
      } else if (dynasty === '全部') {
        console.log('显示所有朝代，不应用过滤')
      } else {
        console.log('未指定朝代或朝代为空，不应用过滤')
      }

      // 作者过滤
      if (author) {
        query = query.ilike('author', `%${author}%`)
      }

      // 标签过滤
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',')
        query = query.overlaps('tags', tagArray)
      }

      // 分类过滤（支持山水诗、边塞诗等主题分类）
      if (category) {
        const categoryTags = getCategoryTags(category)
        if (categoryTags.length > 0) {
          query = query.overlaps('tags', categoryTags)
        }
      }

      // 排序
      if (sort) {
        query = query.order(sort, { ascending: order === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // 分页
      console.log(`分页参数: offset=${offset}, limit=${limit}`)
      query = query.range(offset, offset + limit - 1)

      console.log('最终查询构建:', query)
      const { data: poems, error, count } = await query

      if (error) {
        console.error('数据库查询错误详情:', error)
        console.error('错误消息:', error.message)
        console.error('错误详情:', error.details)
        console.error('错误提示:', error.hint)
        throw error
      }

      console.log(`数据库查询结果: ${poems ? poems.length : 0} 条记录, 朝代过滤: ${dynasty || '无'}`)
      console.log('查询总数:', count)
      
      // 如果成功获取数据（包括空结果），返回数据库数据
      if (poems) {
        return res.json({
          poems: poems || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          },
          source: 'database'
        })
      }
    } catch (dbError) {
      console.log('数据库查询失败，返回示例数据:', dbError.message)
    }

    // 如果数据库查询失败或没有数据，返回示例数据
    let samplePoems = getSamplePoems()
    
    // 对示例数据进行朝代过滤
    if (dynasty && dynasty !== '全部') {
      samplePoems = samplePoems.filter(poem => poem.dynasty === dynasty)
    }
    
    const startIndex = offset
    const endIndex = Math.min(startIndex + parseInt(limit), samplePoems.length)
    const paginatedPoems = samplePoems.slice(startIndex, endIndex)

    res.json({
      poems: paginatedPoems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: samplePoems.length,
        totalPages: Math.ceil(samplePoems.length / limit)
      },
      source: 'sample'
    })

  } catch (error) {
    console.error('获取诗词列表错误:', error)
    
    // 即使出错也返回示例数据
    const samplePoems = getSamplePoems().slice(0, parseInt(limit))
    
    res.json({
      poems: samplePoems,
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total: samplePoems.length,
        totalPages: 1
      },
      source: 'sample',
      error: error.message
    })
  }
})

// 高级搜索诗词
router.get('/search', validate(poetrySchemas.search, { query: true }), async (req, res) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 20, 
      dynasty, 
      author,
      tags,
      category,
      sortBy = 'created_at',
      order = 'desc',
      contentType = 'all'
    } = req.query
    
    const offset = (page - 1) * limit

    // 尝试从数据库搜索
    try {
      let searchQuery = supabase
        .from('poems')
        .select(`
          *,
          user:users(username, avatar_url),
          likes:poem_likes(count),
          comments:poem_comments(count)
        `)
        .eq('status', 'published')

      // 构建搜索条件
      const searchConditions = []
      
      if (contentType === 'all' || contentType === 'title') {
        searchConditions.push(`title.ilike.%${query}%`)
      }
      if (contentType === 'all' || contentType === 'author') {
        searchConditions.push(`author.ilike.%${query}%`)
      }
      if (contentType === 'all' || contentType === 'content') {
        searchConditions.push(`content.ilike.%${query}%`)
      }
      if (contentType === 'all' || contentType === 'tags') {
        searchConditions.push(`tags.cs.{${query}}`)
      }
      
      if (searchConditions.length > 0) {
        searchQuery = searchQuery.or(searchConditions.join(','))
      }

      // 朝代过滤
      if (dynasty && dynasty !== '全部') {
        searchQuery = searchQuery.eq('dynasty', dynasty)
      }
      
      // 作者过滤
      if (author) {
        searchQuery = searchQuery.ilike('author', `%${author}%`)
      }
      
      // 标签过滤
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',')
        searchQuery = searchQuery.overlaps('tags', tagArray)
      }
      
      // 分类过滤（支持山水诗、边塞诗等主题分类）
      if (category) {
        const categoryTags = getCategoryTags(category)
        if (categoryTags.length > 0) {
          searchQuery = searchQuery.overlaps('tags', categoryTags)
        }
      }

      // 排序逻辑
      let orderBy = sortBy
      let orderDirection = order === 'asc' ? true : false
      
      // 分页
      searchQuery = searchQuery.range(offset, offset + limit - 1)
        .order(orderBy, { ascending: orderDirection })

      const { data: poems, error, count } = await searchQuery

      if (error) throw error

      // 如果成功获取数据，返回数据库数据
      if (poems && poems.length > 0) {
        // 获取搜索统计信息
        const searchStats = await calculateSearchStats(query)
        const suggestions = await getSearchSuggestions(query)
        const availableDynasties = await getAvailableDynasties()
        const availableAuthors = await getAvailableAuthors(query)

        return res.json({
          poems: poems || [],
          query,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          },
          searchInfo: {
            query,
            results: count || 0,
            suggestions,
            relatedQueries: await getRelatedQueries(query)
          },
          filters: {
            availableDynasties,
            availableAuthors
          },
          stats: searchStats,
          source: 'database'
        })
      }
    } catch (dbError) {
      console.log('数据库搜索失败，返回示例数据:', dbError.message)
    }

    // 如果数据库搜索失败或没有结果，从示例数据中搜索
    const samplePoems = getSamplePoems()
    const searchResults = samplePoems.filter(poem => {
      const searchTerm = query.toLowerCase()
      return poem.title.toLowerCase().includes(searchTerm) ||
             poem.author.toLowerCase().includes(searchTerm) ||
             poem.content.toLowerCase().includes(searchTerm) ||
             poem.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    })

    const startIndex = offset
    const endIndex = Math.min(startIndex + parseInt(limit), searchResults.length)
    const paginatedResults = searchResults.slice(startIndex, endIndex)

    res.json({
      poems: paginatedResults,
      query,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: searchResults.length,
        totalPages: Math.ceil(searchResults.length / limit)
      },
      searchInfo: {
        query,
        results: searchResults.length,
        suggestions: [],
        relatedQueries: []
      },
      filters: {
        availableDynasties: ['唐', '宋'],
        availableAuthors: searchResults.map(p => p.author).filter((v, i, a) => a.indexOf(v) === i)
      },
      stats: {
        totalCount: searchResults.length,
        averageLength: searchResults.length > 0 ? 
          Math.round(searchResults.reduce((sum, poem) => sum + poem.content.length, 0) / searchResults.length) : 0
      },
      source: 'sample'
    })

  } catch (error) {
    console.error('搜索诗词错误:', error)
    
    // 即使出错也返回示例搜索结果
    const samplePoems = getSamplePoems()
    const searchTerm = query?.toLowerCase() || ''
    const searchResults = samplePoems.filter(poem => {
      return poem.title.toLowerCase().includes(searchTerm) ||
             poem.author.toLowerCase().includes(searchTerm)
    }).slice(0, parseInt(limit) || 20)
    
    res.json({
      poems: searchResults,
      query: query || '',
      pagination: {
        page: 1,
        limit: parseInt(limit) || 20,
        total: searchResults.length,
        totalPages: 1
      },
      searchInfo: {
        query: query || '',
        results: searchResults.length,
        suggestions: [],
        relatedQueries: []
      },
      filters: {
        availableDynasties: ['唐', '宋'],
        availableAuthors: searchResults.map(p => p.author).filter((v, i, a) => a.indexOf(v) === i)
      },
      stats: {
        totalCount: searchResults.length,
        averageLength: 0
      },
      source: 'sample',
      error: error.message
    })
  }
})

// 获取搜索建议
router.get('/search/suggestions', async (req, res) => {
  try {
    const { query } = req.query
    
    if (!query || query.trim() === '') {
      return res.json({ suggestions: [] })
    }
    
    const searchQuery = query.trim()
    
    // 尝试从数据库获取建议
    try {
      const suggestions = await getSearchSuggestions(searchQuery)
      if (suggestions && suggestions.length > 0) {
        return res.json({ suggestions })
      }
    } catch (dbError) {
      console.log('数据库获取搜索建议失败，返回示例建议:', dbError.message)
    }
    
    // 如果数据库失败，返回示例建议
    const samplePoems = getSamplePoems()
    const suggestions = []
    
    // 从标题中获取建议
    samplePoems.forEach(poem => {
      if (poem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push(poem.title)
      }
      if (poem.author.toLowerCase().includes(searchQuery.toLowerCase())) {
        suggestions.push(poem.author)
      }
    })
    
    // 去重并返回前10个建议
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 10)
    
    res.json({ suggestions: uniqueSuggestions })
    
  } catch (error) {
    console.error('获取搜索建议错误:', error)
    
    // 即使出错也返回空建议
    res.json({ suggestions: [] })
  }
})

// 获取热门搜索
router.get('/search/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query
    
    // 这里可以从搜索日志中获取热门搜索词
    // 暂时返回一些示例数据
    const popularSearches = [
      { query: '李白', count: 156 },
      { query: '唐诗', count: 134 },
      { query: '爱情', count: 98 },
      { query: '春天', count: 87 },
      { query: '月亮', count: 76 },
      { query: '杜甫', count: 65 },
      { query: '离别', count: 54 },
      { query: '山水', count: 43 }
    ].slice(0, limit)
    
    res.json({ popularSearches })
    
  } catch (error) {
    console.error('获取热门搜索错误:', error)
    res.status(500).json({
      error: '获取热门搜索失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 辅助函数：计算搜索统计
async function calculateSearchStats(query) {
  try {
    // 获取相关诗词数量统计
    const { count: totalCount } = await supabase
      .from('poems')
      .select('*', { count: 'exact', head: true })
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published')

    // 获取朝代分布
    const { data: dynastyStats } = await supabase
      .from('poems')
      .select('dynasty')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published')

    const dynastyDistribution = {}
    if (dynastyStats) {
      dynastyStats.forEach(poem => {
        dynastyDistribution[poem.dynasty] = (dynastyDistribution[poem.dynasty] || 0) + 1
      })
    }
    
    return {
      totalCount: totalCount || 0,
      dynastyDistribution,
      averageLength: await calculateAveragePoemLength(query)
    }
  } catch (error) {
    console.error('计算搜索统计错误:', error)
    return {}
  }
}

// 辅助函数：获取搜索建议
async function getSearchSuggestions(query) {
  try {
    const suggestions = []
    
    // 从标题中获取建议
    const { data: titleSuggestions } = await supabase
      .from('poems')
      .select('title')
      .ilike('title', `%${query}%`)
      .eq('status', 'published')
      .limit(5)
    
    if (titleSuggestions) {
      titleSuggestions.forEach(poem => {
        suggestions.push(poem.title)
      })
    }
    
    // 从作者中获取建议
    const { data: authorSuggestions } = await supabase
      .from('poems')
      .select('author')
      .ilike('author', `%${query}%`)
      .eq('status', 'published')
      .limit(5)
    
    if (authorSuggestions) {
      authorSuggestions.forEach(poem => {
        suggestions.push(poem.author)
      })
    }
    
    // 去重并返回前10个建议
    return [...new Set(suggestions)].slice(0, 10)
  } catch (error) {
    console.error('获取搜索建议错误:', error)
    return []
  }
}

// 辅助函数：获取相关查询
async function getRelatedQueries(query) {
  try {
    // 这里可以实现更智能的相关查询逻辑
    // 暂时返回一些基于查询词的相关词
    const relatedMap = {
      '李白': ['唐诗', '浪漫主义', '诗仙', '青莲居士'],
      '杜甫': ['唐诗', '现实主义', '诗圣', '少陵野老'],
      '唐诗': ['宋词', '古诗', '诗歌', '文学'],
      '宋词': ['唐诗', '词牌', '苏轼', '李清照'],
      '爱情': ['相思', '离别', '思念', '情感'],
      '春天': ['花开', '温暖', '季节', '自然']
    }
    
    return relatedMap[query] || []
  } catch (error) {
    console.error('获取相关查询错误:', error)
    return []
  }
}

// 辅助函数：获取可用朝代
async function getAvailableDynasties() {
  try {
    const { data } = await supabase
      .from('poems')
      .select('dynasty')
      .not('dynasty', 'is', null)
      .eq('status', 'published')
    
    const dynasties = [...new Set(data?.map(p => p.dynasty) || [])]
    return dynasties.sort()
  } catch (error) {
    console.error('获取可用朝代错误:', error)
    return []
  }
}

// 辅助函数：获取可用作者
async function getAvailableAuthors(query) {
  try {
    const { data } = await supabase
      .from('poems')
      .select('author')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%`)
      .not('author', 'is', null)
      .eq('status', 'published')
    
    const authors = [...new Set(data?.map(p => p.author) || [])]
    return authors.sort()
  } catch (error) {
    console.error('获取可用作者错误:', error)
    return []
  }
}

// 辅助函数：计算平均诗词长度
async function calculateAveragePoemLength(query) {
  try {
    const { data } = await supabase
      .from('poems')
      .select('content')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published')
    
    if (!data || data.length === 0) return 0
    
    const totalLength = data.reduce((sum, poem) => {
      return sum + (poem.content?.length || 0)
    }, 0)
    
    return Math.round(totalLength / data.length)
  } catch (error) {
    console.error('计算平均长度错误:', error)
    return 0
  }
}

// 辅助函数：获取分类对应的标签
function getCategoryTags(category) {
  const categoryTagMap = {
    '山水诗': ['山水', '自然', '风景', '江河', '山岳'],
    '边塞诗': ['边塞', '战争', '边疆', '军旅', '征戍'],
    '爱情诗': ['爱情', '相思', '恋情', '思念', '情感'],
    '思乡诗': ['思乡', '故乡', '乡愁', '归乡', '怀乡'],
    '咏物诗': ['咏物', '描写', '物品', '自然', '动物'],
    '哲理诗': ['哲理', '人生', '思考', '智慧', '感悟']
  }
  
  return categoryTagMap[category] || []
}

// 示例数据函数
function getSamplePoems() {
  return [
    {
      id: '1',
      title: '静夜思',
      author: '李白',
      dynasty: '唐',
      content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
      tags: ['思乡', '月亮', '夜晚'],
      views: 1560,
      like_count: 234,
      comment_count: 45,
      created_at: '2024-01-01T00:00:00Z',
      user: {
        username: 'admin',
        avatar: null
      }
    },
    {
      id: '2',
      title: '春晓',
      author: '孟浩然',
      dynasty: '唐',
      content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
      tags: ['春天', '自然', '生活'],
      views: 1280,
      like_count: 189,
      comment_count: 32,
      created_at: '2024-01-02T00:00:00Z',
      user: {
        username: 'poetry_lover',
        avatar: null
      }
    },
    {
      id: '3',
      title: '登鹳雀楼',
      author: '王之涣',
      dynasty: '唐',
      content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
      tags: ['登高', '壮丽', '哲理'],
      views: 980,
      like_count: 156,
      comment_count: 28,
      created_at: '2024-01-03T00:00:00Z',
      user: {
        username: 'classic_reader',
        avatar: null
      }
    },
    {
      id: '4',
      title: '水调歌头',
      author: '苏轼',
      dynasty: '宋',
      content: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。',
      tags: ['中秋', '思念', '月亮'],
      views: 1120,
      like_count: 201,
      comment_count: 39,
      created_at: '2024-01-04T00:00:00Z',
      user: {
        username: 'admin',
        avatar: null
      }
    },
    {
      id: '5',
      title: '声声慢',
      author: '李清照',
      dynasty: '宋',
      content: '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。',
      tags: ['忧愁', '秋天', '思念'],
      views: 890,
      like_count: 143,
      comment_count: 25,
      created_at: '2024-01-05T00:00:00Z',
      user: {
        username: 'poetry_lover',
        avatar: null
      }
    },
    {
      id: '6',
      title: '望庐山瀑布',
      author: '李白',
      dynasty: '唐',
      content: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。',
      tags: ['山水', '壮丽', '自然'],
      views: 1340,
      like_count: 178,
      comment_count: 31,
      created_at: '2024-01-06T00:00:00Z',
      user: {
        username: 'admin',
        avatar: null
      }
    },
    {
      id: '7',
      title: '相思',
      author: '王维',
      dynasty: '唐',
      content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。',
      tags: ['爱情', '思念', '红豆'],
      views: 1020,
      like_count: 165,
      comment_count: 29,
      created_at: '2024-01-07T00:00:00Z',
      user: {
        username: 'classic_reader',
        avatar: null
      }
    },
    {
      id: '8',
      title: '江雪',
      author: '柳宗元',
      dynasty: '唐',
      content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
      tags: ['冬天', '孤独', '雪景'],
      views: 760,
      like_count: 132,
      comment_count: 22,
      created_at: '2024-01-08T00:00:00Z',
      user: {
        username: 'poetry_lover',
        avatar: null
      }
    },
    {
      id: '9',
      title: '山坡羊·潼关怀古',
      author: '张养浩',
      dynasty: '元',
      content: '峰峦如聚，波涛如怒，山河表里潼关路。望西都，意踌躇。伤心秦汉经行处，宫阙万间都做了土。兴，百姓苦；亡，百姓苦。',
      tags: ['怀古', '民生', '社会'],
      views: 819,
      like_count: 2,
      comment_count: 0,
      created_at: '2024-01-09T00:00:00Z',
      user: {
        username: 'admin',
        avatar: null
      }
    },
    {
      id: '10',
      title: '临江仙',
      author: '杨慎',
      dynasty: '明',
      content: '滚滚长江东逝水，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。白发渔樵江渚上，惯看秋月春风。一壶浊酒喜相逢。古今多少事，都付笑谈中。',
      tags: ['历史', '人生', '哲理'],
      views: 150,
      like_count: 1,
      comment_count: 0,
      created_at: '2024-01-10T00:00:00Z',
      user: {
        username: 'classic_reader',
        avatar: null
      }
    },
    {
      id: '11',
      title: '再别康桥',
      author: '徐志摩',
      dynasty: '现代',
      content: '轻轻的我走了，正如我轻轻的来；我轻轻的招手，作别西天的云彩。那河畔的金柳，是夕阳中的新娘；波光里的艳影，在我的心头荡漾。',
      tags: ['离别', '康桥', '现代'],
      views: 496,
      like_count: 1,
      comment_count: 0,
      created_at: '2024-01-11T00:00:00Z',
      user: {
        username: 'poetry_lover',
        avatar: null
      }
    },
    {
      id: '12',
      title: '乡愁',
      author: '余光中',
      dynasty: '现代',
      content: '小时候，乡愁是一枚小小的邮票，我在这头，母亲在那头。长大后，乡愁是一张窄窄的船票，我在这头，新娘在那头。后来啊，乡愁是一方矮矮的坟墓，我在外头，母亲在里头。而现在，乡愁是一湾浅浅的海峡，我在这头，大陆在那头。',
      tags: ['乡愁', '思念', '现代'],
      views: 602,
      like_count: 2,
      comment_count: 0,
      created_at: '2024-01-12T00:00:00Z',
      user: {
        username: 'admin',
        avatar: null
      }
    },
    {
      id: '13',
      title: '雨巷',
      author: '戴望舒',
      dynasty: '现代',
      content: '撑着油纸伞，独自彷徨在悠长、悠长又寂寥的雨巷，我希望逢着一个丁香一样地结着愁怨的姑娘。',
      tags: ['雨巷', '忧愁', '现代'],
      views: 874,
      like_count: 2,
      comment_count: 0,
      created_at: '2024-01-13T00:00:00Z',
      user: {
        username: 'classic_reader',
        avatar: null
      }
    },
    {
      id: '14',
      title: '致橡树',
      author: '舒婷',
      dynasty: '现代',
      content: '我如果爱你——绝不像攀援的凌霄花，借你的高枝炫耀自己；我如果爱你——绝不学痴情的鸟儿，为绿荫重复单调的歌曲；也不止像泉源，常年送来清凉的慰藉；也不止像险峰，增加你的高度，衬托你的威仪。',
      tags: ['爱情', '独立', '现代'],
      views: 339,
      like_count: 2,
      comment_count: 0,
      created_at: '2024-01-14T00:00:00Z',
      user: {
        username: 'poetry_lover',
        avatar: null
      }
    },
    {
      id: '15',
      title: '石灰吟',
      author: '于谦',
      dynasty: '明',
      content: '千锤万凿出深山，烈火焚烧若等闲。粉骨碎身浑不怕，要留清白在人间。',
      tags: ['爱国', '清白', '牺牲'],
      views: 181,
      like_count: 1,
      comment_count: 0,
      created_at: '2024-01-15T00:00:00Z',
      user: {
        username: 'admin',
        avatar: null
      }
    }
  ]
}

// 获取随机诗词（用于首页展示）
router.get('/random', async (req, res) => {
  try {
    const { limit = 8 } = req.query
    
    // 尝试从数据库获取随机诗词
    try {
      const { data: poems, error } = await supabase
        .from('poems')
        .select(`
          *,
          user:users(username, avatar_url),
          likes:poem_likes(count),
          comments:poem_comments(count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit))

      if (error) throw error

      // 如果成功获取数据，随机排序后返回
      if (poems && poems.length > 0) {
        const shuffledPoems = poems.sort(() => Math.random() - 0.5)
        return res.json(shuffledPoems)
      }
    } catch (dbError) {
      console.log('数据库获取随机诗词失败，返回示例数据:', dbError.message)
    }

    // 如果数据库查询失败或没有数据，返回示例数据并随机排序
    const samplePoems = getSamplePoems()
    const shuffledPoems = samplePoems.sort(() => Math.random() - 0.5).slice(0, parseInt(limit))
    
    res.json(shuffledPoems)

  } catch (error) {
    console.error('获取随机诗词错误:', error)
    
    // 即使出错也返回示例数据
    const samplePoems = getSamplePoems()
    const shuffledPoems = samplePoems.sort(() => Math.random() - 0.5).slice(0, parseInt(req.query.limit) || 8)
    
    res.json(shuffledPoems)
  }
})

// 获取所有分类
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'landscape', name: '山水诗', description: '描写自然山水景色的诗歌', icon: '🏞️' },
      { id: 'frontier', name: '边塞诗', description: '描写边疆战争和军旅生活的诗歌', icon: '⚔️' },
      { id: 'love', name: '爱情诗', description: '表达爱情和思念的诗歌', icon: '💕' },
      { id: 'nostalgia', name: '思乡诗', description: '表达对故乡思念的诗歌', icon: '🏠' },
      { id: 'philosophy', name: '哲理诗', description: '蕴含人生哲理的诗歌', icon: '🧠' },
      { id: 'friendship', name: '友情诗', description: '歌颂友谊的诗歌', icon: '🤝' },
      { id: 'nature', name: '田园诗', description: '描写田园生活和自然风光的诗歌', icon: '🌾' },
      { id: 'history', name: '咏史诗', description: '咏叹历史人物和事件的诗歌', icon: '📜' }
    ]
    
    res.json({
      categories,
      total: categories.length,
      message: '分类列表获取成功'
    })
  } catch (error) {
    console.error('获取分类列表错误:', error)
    res.status(500).json({
      error: '获取分类失败',
      message: error.message
    })
  }
})

// 获取分类详情
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    const { page = 1, limit = 12 } = req.query
    
    const categoryMap = {
      landscape: { name: '山水诗', tags: ['山水', '自然', '风景'] },
      frontier: { name: '边塞诗', tags: ['边塞', '战争', '军旅'] },
      love: { name: '爱情诗', tags: ['爱情', '相思', '恋情'] },
      nostalgia: { name: '思乡诗', tags: ['思乡', '故乡', '怀旧'] },
      philosophy: { name: '哲理诗', tags: ['哲理', '人生', '感悟'] },
      friendship: { name: '友情诗', tags: ['友情', '送别', '思念'] },
      nature: { name: '田园诗', tags: ['田园', '农家', '自然'] },
      history: { name: '咏史诗', tags: ['历史', '怀古', '人物'] }
    }
    
    const category = categoryMap[categoryId]
    if (!category) {
      return res.status(404).json({
        error: '分类不存在',
        message: `分类ID ${categoryId} 不存在`
      })
    }
    
    // 根据分类标签查询诗词
    const offset = (page - 1) * limit
    let query = supabase
      .from('poems')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .overlaps('tags', category.tags)
    
    const { data: poems, error: dbError, count } = await query
      .range(offset, offset + limit - 1)
    
    if (dbError) throw dbError
    
    res.json({
      category: {
        id: categoryId,
        ...category,
        poemCount: count || 0
      },
      poems: poems || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('获取分类详情错误:', error)
    res.status(500).json({
      error: '获取分类详情失败',
      message: error.message
    })
  }
})

// 获取诗词详情
router.get('/:id', async (req, res) => {
  try {
    const poemId = req.params.id

    // 获取诗词详情
    const { data: poem, error } = await supabase
      .from('poems')
      .select(`
        *,
        user:users(username, avatar_url, bio),
        likes:poem_likes(count),
        comments:poem_comments(count)
      `)
      .eq('id', poemId)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: '诗词不存在',
          message: '未找到指定的诗词'
        })
      }
      throw error
    }

    // 获取评论详情
    const { data: comments, error: commentsError } = await supabase
      .from('poem_comments')
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .eq('poem_id', poemId)
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('获取评论错误:', commentsError)
    }

    // 增加浏览量
    await supabase
      .from('poems')
      .update({ views: (poem.views || 0) + 1 })
      .eq('id', poemId)

    res.json({
      poem: {
        ...poem,
        views: (poem.views || 0) + 1,
        comments: comments || []
      }
    })

  } catch (error) {
    console.error('获取诗词详情错误:', error)
    res.status(500).json({
      error: '获取诗词详情失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 创建新诗词（需要认证）
router.post('/', authenticateToken, validate(poetrySchemas.create), async (req, res) => {
  try {
    const poemData = {
      ...req.body,
      user_id: req.user.id,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: poem, error } = await supabase
      .from('poems')
      .insert(poemData)
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .single()

    if (error) throw error

    res.status(201).json({
      message: '诗词创建成功',
      poem
    })

  } catch (error) {
    console.error('创建诗词错误:', error)
    res.status(500).json({
      error: '创建诗词失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 更新诗词（需要认证且是作者或管理员）
router.put('/:id', authenticateToken, validate(poetrySchemas.update), async (req, res) => {
  try {
    const poemId = req.params.id

    // 检查诗词是否存在且用户有权限修改
    const { data: existingPoem, error: checkError } = await supabase
      .from('poems')
      .select('user_id, status')
      .eq('id', poemId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: '诗词不存在',
          message: '未找到指定的诗词'
        })
      }
      throw checkError
    }

    // 检查权限（作者或管理员）
    if (existingPoem.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '只能修改自己创建的诗词'
      })
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    }

    const { data: poem, error } = await supabase
      .from('poems')
      .update(updateData)
      .eq('id', poemId)
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .single()

    if (error) throw error

    res.json({
      message: '诗词更新成功',
      poem
    })

  } catch (error) {
    console.error('更新诗词错误:', error)
    res.status(500).json({
      error: '更新诗词失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 删除诗词（需要认证且是作者或管理员）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const poemId = req.params.id

    // 检查诗词是否存在且用户有权限删除
    const { data: existingPoem, error: checkError } = await supabase
      .from('poems')
      .select('user_id')
      .eq('id', poemId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          error: '诗词不存在',
          message: '未找到指定的诗词'
        })
      }
      throw checkError
    }

    // 检查权限（作者或管理员）
    if (existingPoem.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: '权限不足',
        message: '只能删除自己创建的诗词'
      })
    }

    // 软删除（更新状态）
    const { error } = await supabase
      .from('poems')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', poemId)

    if (error) throw error

    res.json({
      message: '诗词删除成功',
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('删除诗词错误:', error)
    res.status(500).json({
      error: '删除诗词失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 点赞诗词
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const poemId = req.params.id

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

    // 检查是否已经点赞
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('poem_likes')
      .select('id')
      .eq('poem_id', poemId)
      .eq('user_id', req.user.id)
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      throw likeCheckError
    }

    if (existingLike) {
      // 取消点赞
      const { error: deleteError } = await supabase
        .from('poem_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) throw deleteError

      res.json({
        message: '取消点赞成功',
        liked: false
      })
    } else {
      // 添加点赞
      const { error: insertError } = await supabase
        .from('poem_likes')
        .insert({
          poem_id: poemId,
          user_id: req.user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      res.json({
        message: '点赞成功',
        liked: true
      })
    }

  } catch (error) {
    console.error('点赞操作错误:', error)
    res.status(500).json({
      error: '点赞操作失败',
      message: error.message || '服务器内部错误'
    })
  }
})

// 获取所有分类
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'landscape', name: '山水诗', description: '描写自然山水景色的诗歌', icon: '🏞️' },
      { id: 'frontier', name: '边塞诗', description: '描写边疆战争和军旅生活的诗歌', icon: '⚔️' },
      { id: 'love', name: '爱情诗', description: '表达爱情和思念的诗歌', icon: '💕' },
      { id: 'nostalgia', name: '思乡诗', description: '表达对故乡思念的诗歌', icon: '🏠' },
      { id: 'philosophy', name: '哲理诗', description: '蕴含人生哲理的诗歌', icon: '🧠' },
      { id: 'friendship', name: '友情诗', description: '歌颂友谊的诗歌', icon: '🤝' },
      { id: 'nature', name: '田园诗', description: '描写田园生活和自然风光的诗歌', icon: '🌾' },
      { id: 'history', name: '咏史诗', description: '咏叹历史人物和事件的诗歌', icon: '📜' }
    ]
    
    res.json({
      categories,
      total: categories.length,
      message: '分类列表获取成功'
    })
  } catch (error) {
    console.error('获取分类列表错误:', error)
    res.status(500).json({
      error: '获取分类失败',
      message: error.message
    })
  }
})

// 获取分类详情
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    const { page = 1, limit = 12 } = req.query
    
    const categoryMap = {
      landscape: { name: '山水诗', tags: ['山水', '自然', '风景'] },
      frontier: { name: '边塞诗', tags: ['边塞', '战争', '军旅'] },
      love: { name: '爱情诗', tags: ['爱情', '相思', '恋情'] },
      nostalgia: { name: '思乡诗', tags: ['思乡', '故乡', '怀旧'] },
      philosophy: { name: '哲理诗', tags: ['哲理', '人生', '感悟'] },
      friendship: { name: '友情诗', tags: ['友情', '送别', '思念'] },
      nature: { name: '田园诗', tags: ['田园', '农家', '自然'] },
      history: { name: '咏史诗', tags: ['历史', '怀古', '人物'] }
    }
    
    const category = categoryMap[categoryId]
    if (!category) {
      return res.status(404).json({
        error: '分类不存在',
        message: `分类ID ${categoryId} 不存在`
      })
    }
    
    // 根据分类标签查询诗词
    const offset = (page - 1) * limit
    let query = supabase
      .from('poems')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .overlaps('tags', category.tags)
    
    const { data: poems, error: dbError, count } = await query
      .range(offset, offset + limit - 1)
    
    if (dbError) throw dbError
    
    res.json({
      category: {
        id: categoryId,
        ...category,
        poemCount: count || 0
      },
      poems: poems || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('获取分类详情错误:', error)
    res.status(500).json({
      error: '获取分类详情失败',
      message: error.message
    })
  }
})

export default router