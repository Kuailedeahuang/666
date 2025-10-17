import db from '../config/database.js'

// 示例诗词数据
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
    title: '相思',
    author: '王维',
    dynasty: '唐',
    content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。',
    tags: ['爱情', '思念', '红豆']
  },
  {
    title: '江雪',
    author: '柳宗元',
    dynasty: '唐',
    content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
    tags: ['冬天', '孤独', '自然']
  },
  {
    title: '望庐山瀑布',
    author: '李白',
    dynasty: '唐',
    content: '日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。',
    tags: ['瀑布', '壮丽', '自然']
  },
  {
    title: '黄鹤楼送孟浩然之广陵',
    author: '李白',
    dynasty: '唐',
    content: '故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。',
    tags: ['送别', '友情', '长江']
  },
  {
    title: '枫桥夜泊',
    author: '张继',
    dynasty: '唐',
    content: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。',
    tags: ['夜晚', '思乡', '苏州']
  }
]

async function seedData() {
  try {
    console.log('开始向数据库添加示例诗词数据...')
    
    // 检查是否已有数据
    const existingCount = await db.count('poems')
    console.log(`当前数据库中有 ${existingCount} 条诗词记录`)
    
    if (existingCount > 0) {
      console.log('数据库已有数据，跳过初始化')
      return
    }
    
    // 批量插入示例数据
    console.log('正在插入示例数据...')
    const result = await db.batchInsert('poems', samplePoems)
    console.log(`成功添加 ${result.length} 条诗词记录`)
    
    console.log('数据初始化完成！')
  } catch (error) {
    console.error('数据初始化失败:', error)
    console.error('详细错误信息:', error.message)
  }
}

// 如果是直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
}

export default seedData