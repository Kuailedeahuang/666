import express from 'express';
import axios from 'axios';

const router = express.Router();

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key-here';

// 系统提示词 - 专门针对诗词赏析的AI助手
const SYSTEM_PROMPT = `你是一个专业的诗词赏析AI助手，专门帮助用户理解和欣赏中国古典诗词。

请遵循以下指导原则：
1. 专注于诗词相关的问答，包括诗词解析、作者背景、创作背景、艺术特色等
2. 对于非诗词相关的问题，可以礼貌地引导用户关注诗词内容
3. 回答要专业、准确、有深度，但也要通俗易懂
4. 适当引用相关诗词例句来支持你的观点
5. 保持友好的交流态度

如果用户询问你的身份，你可以说："我是诗词赏析AI助手，专门帮助您理解和欣赏中国古典诗词。"

请用中文回答用户的问题。`;

// AI聊天接口
router.post('/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    // 验证输入
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];

    // 添加上下文消息（如果有）
    if (context.messages && Array.isArray(context.messages)) {
      context.messages.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message.trim()
    });

    // 调用DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 30000 // 30秒超时
    });

    const aiResponse = response.data;

    if (aiResponse.choices && aiResponse.choices.length > 0) {
      const assistantMessage = aiResponse.choices[0].message;
      
      res.json({
        success: true,
        response: assistantMessage.content,
        usage: aiResponse.usage,
        model: aiResponse.model,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'AI API返回异常',
        rawResponse: aiResponse
      });
    }

  } catch (error) {
    console.error('AI聊天接口错误:', error);
    
    // 处理不同的错误类型
    if (error.response) {
      // API返回错误
      res.status(error.response.status).json({
        success: false,
        error: `AI服务错误: ${error.response.status} ${error.response.statusText}`,
        details: error.response.data
      });
    } else if (error.request) {
      // 网络错误
      res.status(503).json({
        success: false,
        error: 'AI服务暂时不可用，请检查网络连接'
      });
    } else {
      // 其他错误
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
});

// 健康检查接口
router.get('/health', (req, res) => {
  res.json({
    service: 'ai-chat',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiConfigured: !!DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'your-deepseek-api-key-here'
  });
});

export default router;