// Vercel构建脚本
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 开始构建诗词赏析平台...')

try {
  // 检查环境变量
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️  警告：缺少Supabase环境变量，请确保在Vercel中配置')
  }

  // 安装依赖
  console.log('📦 安装依赖...')
  execSync('npm install', { stdio: 'inherit' })

  // 构建项目
  console.log('🔨 构建前端应用...')
  execSync('npm run build', { stdio: 'inherit' })

  // 检查构建结果
  const distPath = path.join(__dirname, 'dist')
  if (!fs.existsSync(distPath)) {
    throw new Error('构建失败：dist目录不存在')
  }

  console.log('✅ 构建完成！')
  console.log('📁 构建输出目录：', distPath)

} catch (error) {
  console.error('❌ 构建失败：', error.message)
  process.exit(1)
}