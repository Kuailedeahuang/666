import express from 'express';
import axios from 'axios';

const router = express.Router();

// n8n工作流配置
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/ai-chat-webhook';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'your-deepseek-api-key-here';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

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

// AI聊天接口 - 调用n8n工作流
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

    // 构建n8n工作流请求数据
    const workflowData = {
      text: message.trim(),
      message: message.trim(),
      context: context,
      userId: req.user?.id || 'anonymous',
      sessionId: context.sessionId || `session_${Date.now()}`
    };

    try {
      // 首先尝试调用n8n工作流
      const response = await axios.post(N8N_WEBHOOK_URL, workflowData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      });

      const workflowResponse = response.data;

      if (workflowResponse.success) {
        res.json({
          success: true,
          response: workflowResponse.response,
          usage: workflowResponse.usage,
          model: workflowResponse.model,
          timestamp: workflowResponse.timestamp || new Date().toISOString(),
          source: 'n8n-workflow'
        });
      } else {
        throw new Error(workflowResponse.error || 'n8n工作流返回异常');
      }
    } catch (n8nError) {
      console.log('n8n工作流不可用，尝试备用AI服务:', n8nError.message);
      
      // 检查DeepSeek API密钥是否有效
      if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-deepseek-api-key-here') {
        res.status(503).json({
          success: false,
          error: 'AI服务暂时不可用',
          details: '请配置有效的DeepSeek API密钥或确保n8n工作流服务正常运行',
          suggestion: '请联系管理员配置AI服务或检查n8n工作流状态'
        });
        return;
      }
      
      try {
        // 备用方案：直接调用DeepSeek API
        const messages = [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message.trim()
          }
        ];

        const aiResponse = await axios.post(DEEPSEEK_API_URL, {
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
          timeout: 30000
        });

        const aiData = aiResponse.data;

        if (aiData.choices && aiData.choices.length > 0) {
          const assistantMessage = aiData.choices[0].message;
          
          res.json({
            success: true,
            response: assistantMessage.content,
            usage: aiData.usage,
            model: aiData.model,
            timestamp: new Date().toISOString(),
            source: 'deepseek-api'
          });
        } else {
          throw new Error('AI API返回异常');
        }
      } catch (aiError) {
        console.error('备用AI服务也失败:', aiError.message);
        
        res.status(503).json({
          success: false,
          error: 'AI服务暂时不可用',
          details: 'n8n工作流和备用AI服务均不可用',
          suggestion: '请稍后重试或联系管理员检查AI服务状态'
        });
      }
    }

  } catch (error) {
    console.error('AI聊天接口错误:', error);
    
    // 处理不同的错误类型
    if (error.response) {
      // n8n工作流返回错误
      if (error.response.status === 401) {
        res.status(401).json({
          success: false,
          error: 'n8n工作流认证失败，请检查n8n配置',
          details: '请确保n8n服务正常运行且webhook配置正确'
        });
      } else {
        res.status(error.response.status).json({
          success: false,
          error: `n8n工作流错误: ${error.response.status} ${error.response.statusText}`,
          details: error.response.data
        });
      }
    } else if (error.request) {
      // 网络错误 - n8n服务不可达
      res.status(503).json({
        success: false,
        error: 'n8n工作流服务暂时不可用，请检查n8n服务状态',
        details: '请确保n8n服务在localhost:5678端口正常运行'
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