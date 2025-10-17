import Joi from 'joi'

// 通用验证中间件
export const validate = (schema, options = {}) => {
  return (req, res, next) => {
    const { query: validateQuery = false } = options
    
    // 根据选项决定验证req.body还是req.query
    const dataToValidate = validateQuery ? req.query : req.body
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }))

      return res.status(400).json({
        error: '数据验证失败',
        message: '请求数据不符合要求',
        details: errorDetails
      })
    }

    // 用验证后的数据替换原始数据
    if (validateQuery) {
      req.query = value
    } else {
      req.body = value
    }
    next()
  }
}

// 用户相关验证模式
export const authSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名不能超过30个字符',
        'any.required': '用户名是必填项'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),
    
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': '密码至少需要6个字符',
        'string.max': '密码不能超过128个字符',
        'string.pattern.base': '密码必须包含大小写字母和数字',
        'any.required': '密码是必填项'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': '两次输入的密码不一致',
        'any.required': '请确认密码'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱是必填项'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': '密码是必填项'
      })
  }),

  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional(),
    
    bio: Joi.string()
      .max(500)
      .allow('')
      .optional()
      .messages({
        'string.max': '个人简介不能超过500个字符'
      }),
    
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': '头像链接必须是有效的URL'
      })
  }).min(1) // 至少更新一个字段
}

// 诗词相关验证模式
export const poetrySchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': '诗词标题不能为空',
        'string.max': '诗词标题不能超过100个字符',
        'any.required': '诗词标题是必填项'
      }),
    
    author: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': '作者名称不能为空',
        'string.max': '作者名称不能超过50个字符',
        'any.required': '作者是必填项'
      }),
    
    dynasty: Joi.string()
      .valid('唐', '宋', '元', '明', '清', '现代')
      .required()
      .messages({
        'any.only': '朝代必须是唐、宋、元、明、清或现代',
        'any.required': '朝代是必填项'
      }),
    
    content: Joi.string()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'string.min': '诗词内容不能为空',
        'string.max': '诗词内容不能超过10000个字符',
        'any.required': '诗词内容是必填项'
      }),
    
    tags: Joi.array()
      .items(Joi.string().min(1).max(20))
      .max(10)
      .optional()
      .default([])
      .messages({
        'array.max': '标签数量不能超过10个',
        'string.min': '标签不能为空',
        'string.max': '单个标签不能超过20个字符'
      }),
    
    translation: Joi.string()
      .max(5000)
      .allow('')
      .optional()
      .messages({
        'string.max': '译文不能超过5000个字符'
      }),
    
    notes: Joi.string()
      .max(2000)
      .allow('')
      .optional()
      .messages({
        'string.max': '注释不能超过2000个字符'
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(1)
      .max(100)
      .optional(),
    
    author: Joi.string()
      .min(1)
      .max(50)
      .optional(),
    
    dynasty: Joi.string()
      .valid('唐', '宋', '元', '明', '清', '现代')
      .optional(),
    
    content: Joi.string()
      .min(1)
      .max(10000)
      .optional(),
    
    tags: Joi.array()
      .items(Joi.string().min(1).max(20))
      .max(10)
      .optional(),
    
    translation: Joi.string()
      .max(5000)
      .allow('')
      .optional(),
    
    notes: Joi.string()
      .max(2000)
      .allow('')
      .optional()
  }).min(1), // 至少更新一个字段

  search: Joi.object({
    query: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': '搜索关键词不能为空',
        'string.max': '搜索关键词不能超过100个字符',
        'any.required': '搜索关键词是必填项'
      }),
    
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.min': '页码必须大于等于1',
        'number.integer': '页码必须是整数'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.min': '每页数量必须大于等于1',
        'number.max': '每页数量不能超过100',
        'number.integer': '每页数量必须是整数'
      }),
    
    dynasty: Joi.string()
      .max(20)
      .allow('')
      .optional()
      .messages({
        'string.max': '朝代名称不能超过20个字符'
      }),
    
    author: Joi.string()
      .max(50)
      .optional()
      .messages({
        'string.max': '作者名称不能超过50个字符'
      }),
    
    tags: Joi.alternatives()
      .try(
        Joi.string(),
        Joi.array().items(Joi.string().max(20))
      )
      .optional(),
    
    sortBy: Joi.string()
      .valid('created_at', 'title', 'author', 'views', 'likes', 'relevance')
      .default('created_at'),
    
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc'),
    
    contentType: Joi.string()
      .valid('all', 'title', 'author', 'content', 'tags')
      .default('all')
  })
}

// 分页查询验证模式
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  sort: Joi.string()
    .valid('created_at', 'title', 'author', 'views', 'likes')
    .default('created_at'),
  
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
})

export default {
  validate,
  authSchemas,
  poetrySchemas,
  paginationSchema
}