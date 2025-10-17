import { defineStore } from 'pinia'
import { supabase } from '@/config/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    isLoading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userEmail: (state) => state.user?.email,
    userName: (state) => state.user?.user_metadata?.name || state.user?.email?.split('@')[0]
  },

  actions: {
    // 初始化认证状态
    async initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        this.session = session
        this.user = session?.user ?? null
        
        // 监听认证状态变化
        supabase.auth.onAuthStateChange((event, session) => {
          this.session = session
          this.user = session?.user ?? null
          
          console.log('认证状态变化:', event)
        })
      } catch (error) {
        console.error('初始化认证失败:', error)
      }
    },

    // 用户注册
    async signUp(email, password, metadata = {}) {
      this.isLoading = true
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('注册失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 用户登录
    async signIn(email, password) {
      this.isLoading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 第三方登录（Google等）
    async signInWithProvider(provider) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin
          }
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('第三方登录失败:', error)
        throw error
      }
    },

    // 用户登出
    async signOut() {
      this.isLoading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        this.user = null
        this.session = null
      } catch (error) {
        console.error('登出失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // 重置密码
    async resetPassword(email) {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('重置密码失败:', error)
        throw error
      }
    },

    // 更新用户资料
    async updateProfile(updates) {
      try {
        const { data, error } = await supabase.auth.updateUser(updates)
        if (error) throw error
        
        this.user = data.user
        return data
      } catch (error) {
        console.error('更新资料失败:', error)
        throw error
      }
    },

    // 获取用户资料
    async getUserProfile() {
      if (!this.user) return null
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', this.user.id)
          .single()
        
        if (error && error.code !== 'PGRST116') throw error // PGRST116表示没有找到记录
        return data
      } catch (error) {
        console.error('获取用户资料失败:', error)
        return null
      }
    }
  },

  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage
      }
    ]
  }
})