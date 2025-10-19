# 诗词赏析平台

AI驱动的诗词赏析平台，支持诗词浏览、分类、搜索和智能赏析功能。

## 部署说明

### Vercel 部署

项目已配置好Vercel部署，构建输出目录为 `dist`。

**部署步骤：**
1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. Vercel会自动检测配置并部署

**配置说明：**
- 构建命令：`npm run build`
- 输出目录：`dist`
- 开发命令：`npm run dev`

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── components/     # 通用组件
├── views/          # 页面组件
├── router/         # 路由配置
├── stores/         # 状态管理
├── config/         # 配置文件
└── main.js         # 入口文件
```

## 功能特性

- 📚 诗词浏览与分类
- 🔍 智能搜索功能
- 🤖 AI智能赏析
- 💾 本地收藏功能
- 📱 响应式设计