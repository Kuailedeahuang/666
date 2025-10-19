// API配置
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// 根据环境设置API基础URL
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api'

// API端点配置
export const API_ENDPOINTS = {
  // 诗词相关
  POETRY: {
    SEARCH: '/poetry/search',
    POPULAR: '/poetry/search/popular',
    DETAIL: '/poetry',
    CREATE: '/poetry',
    UPDATE: '/poetry',
    DELETE: '/poetry'
  },
  
  // 用户相关
  USER: {
    PROFILE: '/users/profile',
    FAVORITES: '/users/favorites',
    HISTORY: '/users/history'
  },
  
  // 收藏相关
  FAVORITES: {
    LIST: '/favorites',
    ADD: '/favorites',
    REMOVE: '/favorites'
  },
  
  // AI聊天相关
  AI_CHAT: {
    CHAT: '/ai-chat',
    HISTORY: '/ai-chat/history'
  },
  
  // 分析相关
  ANALYSIS: {
    ANALYZE: '/analysis',
    STATS: '/analysis/stats'
  }
}

// 构建完整API URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}

// 默认请求配置
export const DEFAULT_REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  DEFAULT_REQUEST_CONFIG
}