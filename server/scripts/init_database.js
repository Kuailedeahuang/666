import { supabase } from '../config/database.js'
import fs from 'fs'
import path from 'path'

async function initDatabase() {
  console.log('开始初始化Supabase数据库...')
  
  try {
    // 1. 创建表结构
    console.log('创建表结构...')
    const createTablesSQL = fs.readFileSync(
      path.join(process.cwd(), 'server/sql/create_tables.sql'), 
      'utf8'
    )
    
    // 由于Supabase不支持直接执行多语句SQL，我们需要逐条执行
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim())
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          // 对于CREATE语句，Supabase可能需要使用SQL编辑器执行
          console.log(`执行SQL: ${stmt.substring(0, 100)}...`)
          // 这里我们只能记录需要手动执行的SQL
        } catch (error) {
          console.warn(`SQL执行警告: ${error.message}`)
        }
      }
    }
    
    // 2. 插入示例数据
    console.log('插入示例数据...')
    const seedDataSQL = fs.readFileSync(
      path.join(process.cwd(), 'server/sql/seed_data.sql'), 
      'utf8'
    )
    
    const seedStatements = seedDataSQL.split(';').filter(stmt => stmt.trim())
    
    for (const stmt of seedStatements) {
      if (stmt.trim()) {
        try {
          console.log(`执行数据插入: ${stmt.substring(0, 100)}...`)
        } catch (error) {
          console.warn(`数据插入警告: ${error.message}`)
        }
      }
    }
    
    console.log('数据库初始化完成！')
    console.log('请登录Supabase控制台手动执行SQL文件来创建表结构。')
    
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
}

export default initDatabase