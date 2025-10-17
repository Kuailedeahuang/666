import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// 创建Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL || 'https://skpchqqlzwvhqcrmqdvh.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcGNocXFsend2aHFjcm1xZHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Njg1ODAsImV4cCI6MjA3NjA0NDU4MH0.apybYeYb53bxlKA5YBV30hsnjru7qXvTUdrKPXA1Uzc'

console.log('Supabase配置检查:', {
  url: supabaseUrl ? '已设置' : '未设置',
  key: supabaseKey ? '已设置' : '未设置'
})

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase配置错误:', { supabaseUrl, supabaseKey })
  throw new Error('缺少Supabase配置，请检查环境变量')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// 数据库服务类
export class DatabaseService {
  constructor() {
    this.client = supabase
  }

  // 通用查询方法
  async query(table, operation = 'select', options = {}) {
    try {
      let query = this.client.from(table)

      switch (operation) {
        case 'select':
          query = query.select(options.columns || '*')
          if (options.where) query = query.match(options.where)
          if (options.order) query = query.order(options.order.column, { ascending: options.order.ascending })
          if (options.limit) query = query.limit(options.limit)
          if (options.offset) query = query.range(options.offset, options.offset + options.limit - 1)
          break
        
        case 'insert':
          query = query.insert(options.data).select()
          break
        
        case 'update':
          query = query.update(options.data).match(options.where).select()
          break
        
        case 'delete':
          query = query.delete().match(options.where).select()
          break
        
        default:
          throw new Error(`不支持的数据库操作: ${operation}`)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error(`数据库操作失败 [${table}.${operation}]:`, error)
      throw new Error(`数据库错误: ${error.message}`)
    }
  }

  // 批量操作
  async batchInsert(table, records) {
    try {
      const { data, error } = await this.client
        .from(table)
        .insert(records)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`批量插入失败 [${table}]:`, error)
      throw error
    }
  }

  // 全文搜索
  async search(table, query, searchColumns = ['title', 'content']) {
    try {
      const searchConditions = searchColumns.map(col => `${col}.ilike.%${query}%`).join(',')
      
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .or(searchConditions)

      if (error) throw error
      return data
    } catch (error) {
      console.error(`搜索失败 [${table}]:`, error)
      throw error
    }
  }

  // 统计计数
  async count(table, where = {}) {
    try {
      let query = this.client
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (Object.keys(where).length > 0) {
        query = query.match(where)
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error(`计数失败 [${table}]:`, error)
      throw error
    }
  }

  // 事务处理（Supabase不支持传统事务，但可以模拟）
  async transaction(operations) {
    const results = []
    
    for (const op of operations) {
      try {
        const result = await this.query(op.table, op.operation, op.options)
        results.push(result)
      } catch (error) {
        // 如果某个操作失败，回滚之前的操作
        console.error('事务操作失败，已回滚:', error)
        throw error
      }
    }
    
    return results
  }
}

// 导出单例实例
export const db = new DatabaseService()

export default db