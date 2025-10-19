import { buildApiUrl, DEFAULT_REQUEST_CONFIG } from '@/config/api.js'

// HTTP请求工具类
class HttpClient {
  constructor(baseConfig = {}) {
    this.baseConfig = { ...DEFAULT_REQUEST_CONFIG, ...baseConfig }
  }

  // 处理响应
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP错误: ${response.status}`)
    }
    return response.json()
  }

  // 通用请求方法
  async request(url, config = {}) {
    const fullUrl = url.startsWith('http') ? url : buildApiUrl(url)
    const finalConfig = {
      ...this.baseConfig,
      ...config,
      headers: {
        ...this.baseConfig.headers,
        ...config.headers
      }
    }

    try {
      const response = await fetch(fullUrl, finalConfig)
      return this.handleResponse(response)
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  // GET请求
  async get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' })
  }

  // POST请求
  async post(url, data = {}, config = {}) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT请求
  async put(url, data = {}, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE请求
  async delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' })
  }

  // PATCH请求
  async patch(url, data = {}, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

// 创建全局HTTP客户端实例
export const httpClient = new HttpClient()

// 导出便捷方法
export const http = {
  get: (url, config) => httpClient.get(url, config),
  post: (url, data, config) => httpClient.post(url, data, config),
  put: (url, data, config) => httpClient.put(url, data, config),
  delete: (url, config) => httpClient.delete(url, config),
  patch: (url, data, config) => httpClient.patch(url, data, config)
}

export default http