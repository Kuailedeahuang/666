// Supabase配置测试脚本
// 运行: node test-supabase.js

import('node-fetch').then(async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ 请先设置环境变量:')
    console.log('   VITE_SUPABASE_URL=你的Supabase项目URL')
    console.log('   VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥')
    console.log('   或者创建.env文件并填入配置')
    return
  }
  
  console.log('🔗 测试Supabase连接...')
  
  try {
    // 测试基础连接
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Supabase连接成功!')
      console.log('📊 项目信息:')
      console.log(`   项目URL: ${supabaseUrl}`)
      console.log(`   API密钥: ${supabaseKey.slice(0, 10)}...`)
    } else {
      console.log('❌ Supabase连接失败:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ 连接错误:', error.message)
  }
}).catch(err => {
  console.log('⚠️  需要安装node-fetch: npm install node-fetch')
})