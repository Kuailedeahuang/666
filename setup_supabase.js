#!/usr/bin/env node

/**
 * Supabase数据库设置脚本
 * 这个脚本帮助用户快速设置Supabase数据库
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🎯 Supabase数据库设置向导')
  console.log('='.repeat(50))
  
  try {
    // 1. 获取Supabase配置信息
    console.log('\n📋 步骤1: 配置Supabase连接信息')
    
    const supabaseUrl = await question('请输入Supabase项目URL: ')
    const supabaseKey = await question('请输入Supabase匿名密钥: ')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase配置信息不能为空')
      process.exit(1)
    }
    
    // 2. 创建Supabase客户端
    console.log('\n🔗 正在连接Supabase...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 3. 测试连接
    console.log('🧪 测试数据库连接...')
    const { data, error } = await supabase.from('poems').select('id').limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('ℹ️  表不存在，需要创建表结构')
    } else if (error) {
      console.error('❌ 连接测试失败:', error.message)
      process.exit(1)
    } else {
      console.log('✅ 连接测试成功')
    }
    
    // 4. 更新环境变量文件
    console.log('\n📝 更新环境变量配置...')
    
    let envContent = ''
    const envFile = '.env'
    
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8')
      
      // 更新现有的Supabase配置
      envContent = envContent.replace(
        /SUPABASE_URL=.*/g, 
        `SUPABASE_URL=${supabaseUrl}`
      )
      envContent = envContent.replace(
        /SUPABASE_ANON_KEY=.*/g, 
        `SUPABASE_ANON_KEY=${supabaseKey}`
      )
    } else {
      // 创建新的环境变量文件
      envContent = `# Supabase配置
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseKey}
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥

# 后端服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000`
    }
    
    fs.writeFileSync(envFile, envContent)
    console.log('✅ 环境变量文件已更新')
    
    // 5. 显示下一步操作指南
    console.log('\n📋 下一步操作指南:')
    console.log('1. 登录Supabase控制台: https://supabase.com/dashboard')
    console.log('2. 进入SQL编辑器')
    console.log('3. 复制以下文件内容并执行:')
    console.log('   - server/sql/create_tables.sql (创建表结构)')
    console.log('   - server/sql/seed_data.sql (插入示例数据)')
    console.log('4. 重启后端服务器: npm run dev')
    console.log('5. 访问应用: http://localhost:3000')
    
    console.log('\n🎉 设置完成！请按照上述指南完成数据库初始化。')
    
  } catch (error) {
    console.error('❌ 设置过程中出现错误:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default main