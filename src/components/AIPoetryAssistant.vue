<template>
  <!-- AI诗词助手浮窗 -->
  <div class="ai-assistant" :class="{ 'ai-assistant-open': isOpen }">
    <!-- 悬浮按钮 -->
    <div class="ai-assistant-btn" @click="toggleAssistant">
      <i class="fas fa-robot"></i>
      <span class="ai-tooltip">AI诗词助手</span>
    </div>

    <!-- 助手面板 -->
    <div class="ai-panel" v-if="isOpen">
      <!-- 头部 -->
      <div class="ai-header">
        <h3>AI诗词助手</h3>
        <button class="ai-close" @click="closeAssistant">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 聊天区域 -->
      <div class="ai-chat-area" ref="chatArea">
        <div v-for="(message, index) in chatHistory" :key="index" 
             :class="['message', message.type]">
          <div class="message-avatar">
            <i :class="message.type === 'user' ? 'fas fa-user' : 'fas fa-robot'"></i>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="ai-input-area">
        <div class="quick-actions">
          <button v-for="action in quickActions" :key="action.id" 
                  class="quick-action-btn" @click="sendQuickMessage(action)">
            {{ action.text }}
          </button>
        </div>
        
        <div class="input-container">
          <textarea v-model="userInput" placeholder="请输入您的问题..." 
                   @keydown.enter.prevent="sendMessage" 
                   :disabled="isLoading"></textarea>
          <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim() || isLoading">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'

const isOpen = ref(false)
const isLoading = ref(false)
const userInput = ref('')
const chatHistory = ref([])
const chatArea = ref(null)

// 快速操作选项
const quickActions = ref([
  { id: 1, text: '推荐唐诗', prompt: '请推荐一首经典的唐诗' },
  { id: 2, text: '推荐宋词', prompt: '请推荐一首优美的宋词' },
  { id: 3, text: '诗词赏析', prompt: '请赏析一首诗词' },
  { id: 4, text: '按作者搜索', prompt: '搜索李白的诗词' },
  { id: 5, text: '按主题搜索', prompt: '搜索关于春天的诗词' },
  { id: 6, text: '创作指导', prompt: '如何创作一首好诗' }
])

// 获取真实诗词数据
const fetchPoetryData = async (query = '', dynasty = '', author = '', theme = '') => {
  try {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (dynasty) params.append('dynasty', dynasty)
    if (author) params.append('author', author)
    if (theme) params.append('theme', theme)
    params.append('limit', '5')
    
    const response = await fetch(`http://localhost:3001/api/poetry/?${params}`)
    const data = await response.json()
    return data.poems || []
  } catch (error) {
    console.error('获取诗词数据失败:', error)
    return []
  }
}

// 智能分析用户意图
const analyzeUserIntent = (message) => {
  const intents = {
    // 朝代相关
    '唐': 'dynasty',
    '宋': 'dynasty', 
    '元': 'dynasty',
    '明': 'dynasty',
    '清': 'dynasty',
    '现代': 'dynasty',
    
    // 作者相关
    '李白': 'author',
    '杜甫': 'author',
    '苏轼': 'author',
    '李清照': 'author',
    '辛弃疾': 'author',
    '王维': 'author',
    '白居易': 'author',
    
    // 主题相关
    '春天': 'theme',
    '夏天': 'theme',
    '秋天': 'theme',
    '冬天': 'theme',
    '山水': 'theme',
    '边塞': 'theme',
    '爱情': 'theme',
    '思乡': 'theme',
    '离别': 'theme'
  };
  
  for (const [keyword, intent] of Object.entries(intents)) {
    if (message.includes(keyword)) {
      return { type: intent, value: keyword }
    }
  }
  
  // 默认意图
  if (message.includes('推荐') || message.includes('介绍') || message.includes('什么')) {
    return { type: 'recommend', value: '' }
  }
  
  if (message.includes('赏析') || message.includes('解析') || message.includes('理解')) {
    return { type: 'analyze', value: '' }
  }
  
  return { type: 'general', value: '' }
}

// 智能AI回复
const getAIResponse = async (userMessage) => {
  const intent = analyzeUserIntent(userMessage)
  
  try {
    // 构建上下文信息
    const context = {
      intent: intent,
      lastMessages: chatHistory.value.slice(-3).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    };
    
    // 调用后端AI聊天API
    const response = await fetch('/api/ai-chat/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        context: context
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'AI服务返回错误');
    }
    
    return data.response;
    
  } catch (error) {
    console.error('AI聊天API错误:', error);
    
    // 如果AI服务不可用，使用备用回复
    const poems = await fetchPoetryData(userMessage);
    
    if (poems.length > 0) {
      return formatPoetryResponse(poems, intent, userMessage);
    } else {
      return `抱歉，AI服务暂时不可用，请稍后重试。

您可以尝试：
• 搜索其他关键词
• 按朝代浏览（如：唐诗、宋词）
• 按作者搜索（如：李白、苏轼）
• 按主题搜索（如：春天、山水）

错误信息：${error.message}`;
    }
  }
}

// 格式化诗词响应
const formatPoetryResponse = (poems, intent, userMessage) => {
  if (poems.length === 0) return '没有找到相关诗词。'
  
  let response = ''
  
  if (intent.type === 'dynasty') {
    response += `为您推荐${intent.value}代的经典诗词：

`
  } else if (intent.type === 'author') {
    response += `为您推荐${intent.value}的经典作品：

`
  } else if (intent.type === 'theme') {
    response += `为您推荐关于${intent.value}的诗词：

`
  } else {
    response += `根据"${userMessage}"为您找到以下诗词：

`
  }
  
  poems.forEach((poem, index) => {
    response += `📖 **${poem.title}** - ${poem.author}（${poem.dynasty}）
`
    response += `📜 ${poem.content.substring(0, 50)}${poem.content.length > 50 ? '...' : ''}
`
    
    if (poem.translation) {
      response += `💭 ${poem.translation.substring(0, 60)}${poem.translation.length > 60 ? '...' : ''}
`
    }
    
    if (poem.annotation) {
      response += `🎯 ${poem.annotation.substring(0, 80)}${poem.annotation.length > 80 ? '...' : ''}
`
    }
    
    response += `🏷️ 标签：${poem.tags?.join('、') || '无'}
`
    response += `⭐ 难度：${'★'.repeat(poem.difficulty_level || 1)}

`
  })
  
  response += `💡 **小贴士**：
`
  response += `• 点击诗词标题可以查看完整内容
`
  response += `• 可以按朝代、作者、主题进行精确搜索
`
  response += `• 需要更多帮助请随时问我！`
  
  return response
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  const message = userInput.value.trim()
  userInput.value = ''
  
  // 添加用户消息
  chatHistory.value.push({
    type: 'user',
    content: message,
    timestamp: new Date()
  })
  
  isLoading.value = true
  
  try {
    // 获取AI回复
    const aiResponse = await getAIResponse(message)
    
    // 添加AI回复
    chatHistory.value.push({
      type: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('AI回复错误:', error)
    chatHistory.value.push({
      type: 'assistant',
      content: '抱歉，我暂时无法处理您的请求，请稍后再试。',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 发送快速消息
const sendQuickMessage = (action) => {
  userInput.value = action.prompt
  sendMessage()
}

// 切换助手面板
const toggleAssistant = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 关闭助手
const closeAssistant = () => {
  isOpen.value = false
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight
    }
  })
}

// 格式化消息内容（支持换行）
const formatMessage = (content) => {
  return content.replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化欢迎消息
onMounted(() => {
  chatHistory.value.push({
    type: 'assistant',
    content: '您好！我是AI诗词助手，可以为您提供：\n\n• 诗词推荐和赏析\n• 创作指导和技巧\n• 诗词知识讲解\n• 格律韵律分析\n\n请随时向我提问！',
    timestamp: new Date()
  })
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.ai-assistant-btn {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
}

.ai-assistant-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.ai-assistant-btn i {
  font-size: 24px;
  color: white;
}

.ai-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.ai-assistant-btn:hover .ai-tooltip {
  opacity: 1;
  visibility: visible;
}

.ai-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ai-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.ai-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ai-chat-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8f9fa;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #667eea;
}

.message-avatar i {
  font-size: 14px;
  color: #6c757d;
}

.message.user .message-avatar i {
  color: white;
}

.message-content {
  max-width: 70%;
  background: white;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message.user .message-content {
  background: #667eea;
  color: white;
}

.message-text {
  line-height: 1.5;
  font-size: 14px;
}

.message-time {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  text-align: right;
}

.message.user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.ai-input-area {
  border-top: 1px solid #e9ecef;
  background: white;
}

.quick-actions {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid #e9ecef;
}

.quick-action-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.quick-action-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.input-container {
  padding: 12px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-container textarea {
  flex: 1;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  padding: 12px 16px;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  min-height: 40px;
  max-height: 120px;
  outline: none;
  transition: border-color 0.3s ease;
}

.input-container textarea:focus {
  border-color: #667eea;
}

.input-container textarea:disabled {
  background: #f8f9fa;
  opacity: 0.7;
}

.send-btn {
  width: 40px;
  height: 40px;
  background: #667eea;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: #5a6fd8;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.ai-chat-area::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ai-chat-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ai-chat-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>