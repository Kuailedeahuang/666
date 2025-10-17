# 诗歌赏析平台部署指南

本文档提供完整的诗歌赏析平台部署说明，包括前端和后端的部署配置。

## 项目结构

```
poetry-appreciation/
├── frontend/          # Vue.js 前端应用
├── server/           # Node.js 后端 API
└── DEPLOYMENT.md     # 部署文档
```

## 1. 环境要求

### 开发环境
- Node.js 18+
- npm 8+
- Git

### 生产环境
- Node.js 18+ 或 Docker
- 数据库: Supabase (推荐) 或 PostgreSQL
- 可选: Redis (用于缓存)

## 2. 快速开始

### 2.1 克隆项目
```bash
git clone <repository-url>
cd poetry-appreciation
```

### 2.2 安装所有依赖
```bash
npm run install:all
```

### 2.3 配置环境变量

#### 前端配置 (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 后端配置 (server/.env)
```env
PORT=3000
NODE_ENV=development

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT 配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI 服务配置（可选）
OPENAI_API_KEY=your_openai_key
BAIDU_AI_API_KEY=your_baidu_key
BAIDU_AI_SECRET_KEY=your_baidu_secret
```

### 2.4 初始化数据库
在 Supabase 控制台的 SQL 编辑器中执行 `server/scripts/init-database.sql`。

### 2.5 启动开发环境
```bash
# 同时启动前端和后端
npm run dev:full

# 或分别启动
npm run dev              # 前端 (端口: 5173)
npm run start:backend    # 后端 (端口: 3000)
```

## 3. 生产环境部署

### 3.1 传统部署 (Node.js)

#### 构建前端
```bash
npm run build
```

#### 启动后端
```bash
cd server
npm start
```

#### 使用 PM2 管理进程
```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd server
pm2 start server.js --name poetry-api

# 设置开机自启
pm2 startup
pm2 save
```

### 3.2 Docker 部署

#### 构建镜像
```bash
# 构建后端镜像
cd server
docker build -t poetry-api .

# 运行容器
docker run -d \
  --name poetry-api \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  poetry-api
```

#### 使用 Docker Compose
```bash
cd server
docker-compose up -d
```

### 3.3 云平台部署

#### Vercel (前端)
1. 连接 GitHub 仓库
2. 配置构建设置
3. 设置环境变量

#### Railway/Render (后端)
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

## 4. 环境变量配置

### 必需配置
```env
# 前端
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 后端
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=secure_jwt_secret_here
```

### 可选配置
```env
# AI 服务
OPENAI_API_KEY=sk-...
BAIDU_AI_API_KEY=your_baidu_key
BAIDU_AI_SECRET_KEY=your_baidu_secret

# 文件上传
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 缓存配置
REDIS_URL=redis://localhost:6379
```

## 5. 数据库配置

### Supabase (推荐)
1. 创建 Supabase 项目
2. 获取连接信息
3. 执行初始化脚本
4. 配置 Row Level Security (RLS)

### 自建 PostgreSQL
```sql
-- 创建数据库
CREATE DATABASE poetry_db;

-- 创建用户
CREATE USER poetry_user WITH PASSWORD 'secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE poetry_db TO poetry_user;
```

## 6. 安全配置

### SSL/TLS 配置
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 防火墙配置
```bash
# 开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # API (可选)
ufw enable
```

## 7. 监控与日志

### 日志配置
```bash
# 查看后端日志
pm2 logs poetry-api

# 或直接查看
tail -f server/logs/app.log
```

### 健康检查
```bash
# API 健康检查
curl http://localhost:3000/health

# 数据库连接检查
curl http://localhost:3000/api/health/db
```

## 8. 备份策略

### 数据库备份
```bash
# 使用 pg_dump 备份
pg_dump poetry_db > backup_$(date +%Y%m%d).sql

# 或使用 Supabase 的自动备份功能
```

### 文件备份
```bash
# 备份上传的文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz server/uploads/
```

## 9. 性能优化

### 前端优化
- 启用 Gzip 压缩
- 使用 CDN 加速静态资源
- 实现懒加载和代码分割

### 后端优化
- 启用缓存 (Redis)
- 数据库连接池优化
- API 响应压缩

### Nginx 配置示例
```nginx
# Gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 10. 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查环境变量配置
   - 验证网络连接
   - 检查防火墙设置

2. **JWT 认证问题**
   - 确认 JWT_SECRET 一致
   - 检查令牌过期时间
   - 验证令牌签名

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认存储空间

### 调试模式
```bash
# 启用详细日志
DEBUG=* npm start

# 或设置环境变量
NODE_ENV=development
```

## 11. 更新部署

### 常规更新
```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
npm run install:all

# 重启服务
pm2 restart poetry-api
```

### 数据库迁移
```sql
-- 在 Supabase SQL 编辑器中执行迁移脚本
-- 或使用迁移工具
```

## 12. 扩展部署

### 负载均衡
```nginx
upstream poetry_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location / {
        proxy_pass http://poetry_servers;
    }
}
```

### 容器编排 (Kubernetes)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: poetry-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: poetry-api
        image: poetry-api:latest
        ports:
        - containerPort: 3000
```

## 支持与维护

如有部署问题，请参考：
- 项目 README 文档
- 服务器日志文件
- 在线文档和社区

**注意**: 生产环境部署前请务必进行充分测试，确保数据安全和系统稳定性。