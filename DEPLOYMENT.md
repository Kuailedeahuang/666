# 诗词赏析AI平台部署指南

## Vercel 部署

### 部署步骤

1. **连接 GitHub 仓库**
   - 将代码推送到 GitHub 仓库
   - 在 Vercel 中导入该仓库

2. **环境变量配置**
   - 在 Vercel 项目设置中添加以下环境变量：
   ```
   VITE_SUPABASE_URL=你的Supabase项目URL
   VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   ```

3. **构建配置**
   - 框架预设：Vue.js
   - 构建命令：`npm run build`
   - 输出目录：`dist`

### 故障排除

如果部署后只显示蓝紫色背景：

1. **检查路由配置**
   - 确保 `vercel.json` 中的 SPA 路由配置正确
   - 所有路由都应重定向到 `index.html`

2. **检查构建输出**
   - 确认 `dist` 目录包含正确的文件
   - 检查 `index.html` 中的资源路径

3. **环境变量**
   - 确保 Supabase 环境变量正确配置
   - 检查浏览器控制台是否有错误信息

### 本地测试

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建测试
npm run build
npm run preview
```

### 部署状态检查

- 访问 Vercel 部署的域名
- 检查浏览器开发者工具的控制台错误
- 验证所有路由是否正常工作