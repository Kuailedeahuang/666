import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建Supabase客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 导出常用的Supabase方法
export const auth = supabase.auth
export const storage = supabase.storage
export const from = supabase.from

// 错误处理工具函数
export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error)
  throw new Error(error.message || '数据库操作失败')
}

// 数据操作工具函数
export const supabaseAPI = {
  // 查询数据
  async select(table, query = '*', options = {}) {
    try {
      let queryBuilder = supabase.from(table).select(query)
      
      // 处理全文搜索
      if (options.textSearch && options.searchQuery) {
        const searchColumns = options.textSearch.split(',').map(col => col.trim())
        const searchConditions = searchColumns.map(col => `${col}.ilike.%${options.searchQuery}%`).join(',')
        queryBuilder = queryBuilder.or(searchConditions)
      }
      
      const { data, error } = await queryBuilder
      
      if (error) throw error
      return data
    } catch (error) {
      handleSupabaseError(error)
    }
  },

  // 插入数据
  async insert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
      
      if (error) throw error
      return result
    } catch (error) {
      handleSupabaseError(error)
    }
  },

  // 更新数据
  async update(table, data, match) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .match(match)
        .select()
      
      if (error) throw error
      return result
    } catch (error) {
      handleSupabaseError(error)
    }
  },

  // 删除数据
  async delete(table, match) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .delete()
        .match(match)
        .select()
      
      if (error) throw error
      return result
    } catch (error) {
      handleSupabaseError(error)
    }
  }
}

export default supabase