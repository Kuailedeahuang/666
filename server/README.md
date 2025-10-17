# 诗歌赏析平台后端 API

这是一个基于 Node.js + Express + Supabase 的诗歌赏析平台后端服务。

## 功能特性

- ✅ 用户认证与授权（JWT）
- ✅ 诗词 CRUD 操作
- ✅ 诗词搜索与过滤
- ✅ 收藏与点赞功能
- ✅ AI 诗词分析（支持 OpenAI 和百度 AI）
- ✅ 评论系统
- ✅ 管理员功能
- ✅ 数据统计与分析
- ✅ 文件上传支持
- ✅ 安全防护（CORS、Helmet、速率限制）

## 技术栈

- **运行时**: Node.js (ES Modules)
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + bcrypt
- **验证**: Joi
- **安全**: Helmet、CORS、express-rate-limit
- **AI 服务**: OpenAI API、百度 AI

## 快速开始

### 1. 环境配置

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置您的 Supabase 和其他服务密钥
```

### 2. 安装依赖

```bash
cd server
npm install
```

### 3. 数据库初始化

在 Supabase 控制台的 SQL 编辑器中执行 `scripts/init-database.sql` 文件。

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将在 http://localhost:3000 启动。

## API 文档

### 认证相关

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 诗词相关

#### 获取诗词列表
```http
GET /api/poetry?page=1&limit=20&dynasty=唐&sort=created_at&order=desc
```

#### 搜索诗词
```http
GET /api/poetry/search?query=明月&page=1&limit=20
```

#### 获取诗词详情
```http
GET /api/poetry/:id
```

#### 创建诗词
```http
POST /api/poetry
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "诗词标题",
  "author": "作者",
  "dynasty": "唐",
  "content": "诗词内容",
  "tags": ["标签1", "标签2"]
}
```

### 收藏相关

#### 获取收藏列表
```http
GET /api/favorites
Authorization: Bearer <token>
```

#### 添加收藏
```http
POST /api/favorites/:poemId
Authorization: Bearer <token>
```

#### 取消收藏
```http
DELETE /api/favorites/:poemId
Authorization: Bearer <token>
```

### AI 分析

#### 分析诗词
```http
POST /api/analysis/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "poemId": "诗词ID",
  "analysisType": "comprehensive" // comprehensive|theme|technique|language
}
```

## 数据库结构

### 主要数据表

- `users` - 用户信息
- `poems` - 诗词数据
- `poem_likes` - 点赞记录
- `favorites` - 收藏记录
- `poem_comments` - 评论数据
- `poem_analyses` - AI 分析结果

### 关系说明

- 用户 ↔ 诗词 (1:N)
- 用户 ↔ 点赞 (N:M)
- 用户 ↔ 收藏 (N:M)
- 诗词 ↔ 评论 (1:N)
- 诗词 ↔ 分析 (1:N)

## 环境变量配置

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI 服务配置（可选）
OPENAI_API_KEY=your_openai_key
BAIDU_AI_API_KEY=your_baidu_key
BAIDU_AI_SECRET_KEY=your_baidu_secret

# 文件上传
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 部署指南

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name poetry-api

# 查看服务状态
pm2 status

# 设置开机自启
pm2 startup
pm2 save
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 开发指南

### 代码规范

- 使用 ES6+ 语法
- 使用 async/await 处理异步
- 统一的错误处理机制
- 详细的代码注释

### 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# 自动修复
npm run lint:fix
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或联系开发团队。