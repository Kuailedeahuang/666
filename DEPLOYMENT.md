# 诗词赏析平台部署指南

## Vercel 部署

### 前置要求
- 拥有 Vercel 账户
- 项目代码已推送到 GitHub 仓库

### 部署步骤

1. **准备环境变量**
   在 Vercel 项目中配置以下环境变量：

   ```env
   # Supabase 配置
   VITE_SUPABASE_URL=你的Supabase项目URL
   VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   
   # 生产环境标识
   NODE_ENV=production
   ```

2. **通过 GitHub 部署**
   - 登录 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 配置项目设置：
     - **Framework Preset**: Vite
     - **Build Command**: `npm run vercel-build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **环境变量配置**
   - 在 Vercel 项目设置中进入 "Environment Variables"
   - 添加上述环境变量
   - 重新部署项目

### 本地测试部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **本地部署测试**
   ```bash
   # 在项目根目录执行
   vercel
   
   # 生产环境预览
   vercel --prod
   ```

## 环境配置说明

### 开发环境
- 前端运行在 `http://localhost:3000`
- 后端 API 运行在 `http://localhost:3001`
- API 请求通过代理转发到后端

### 生产环境
- 前端部署在 Vercel
- API 请求直接发送到相对路径 `/api/`
- 需要配置正确的 Supabase 环境变量

## 部署检查清单

- [ ] 环境变量已正确配置
- [ ] 构建命令执行成功
- [ ] 静态文件正确生成
- [ ] API 路由配置正确
- [ ] SPA 路由重写配置正确

## 故障排除

### 构建失败
- 检查 `npm run build` 是否能在本地正常运行
- 确认所有依赖都已正确安装
- 检查环境变量配置

### API 请求失败
- 确认生产环境 API 基础 URL 配置正确
- 检查 CORS 配置
- 验证 Supabase 连接

### 路由问题
- 确认 SPA 重写规则正确配置
- 检查 404 页面处理

## 性能优化建议

1. **图片优化**
   - 使用 WebP 格式
   - 实现懒加载

2. **代码分割**
   - 利用 Vite 的自动代码分割
   - 按路由分割代码块

3. **缓存策略**
   - 静态资源设置长期缓存
   - API 响应合理缓存

## 监控和分析

1. **性能监控**
   - 使用 Vercel Analytics
   - 配置性能预算

2. **错误监控**
   - 集成错误追踪服务
   - 监控 API 错误率

## 更新部署

当代码更新后，Vercel 会自动触发重新部署。也可以通过以下方式手动部署：

```bash
# 通过 CLI 部署
vercel --prod

# 或通过 GitHub 推送触发
git push origin main
```

## 支持的联系方式

如有部署问题，请参考：
- [Vercel 文档](https://vercel.com/docs)
- 项目 README.md
- 项目 issue 页面