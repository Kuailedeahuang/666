<template>
  <div class="profile-container">
    <!-- 导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="font-logo text-xl">诗韵赏析</span>
          <h1 class="page-title">个人中心</h1>
        </div>
        <div class="header-actions">
          <el-button text class="action-btn">
            <i class="fas fa-search"></i>
          </el-button>
          <el-button text class="action-btn">
            <i class="fas fa-user-circle"></i>
          </el-button>
        </div>
      </div>
    </header>

    <!-- 用户信息 -->
    <main class="profile-main">
      <el-card class="user-card" shadow="hover">
        <div class="user-info">
          <div class="avatar-section">
            <div class="avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="user-details">
              <h3 class="username">诗词爱好者</h3>
              <p class="user-stats">已收藏 {{ userStats.favorites }} 首诗词</p>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <h4 class="stat-label">我的创作</h4>
              <p class="stat-value">{{ userStats.creations }}</p>
            </div>
            <div class="stat-item">
              <h4 class="stat-label">浏览历史</h4>
              <p class="stat-value">{{ userStats.views }}</p>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 设置选项 -->
      <el-card class="settings-card" shadow="hover">
        <template #header>
          <h3 class="settings-title">设置</h3>
        </template>
        
        <div class="settings-list">
          <div class="setting-item" @click="navigateTo('account')">
            <div class="setting-info">
              <i class="fas fa-cog"></i>
              <span>账号设置</span>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
          
          <div class="setting-item" @click="navigateTo('notifications')">
            <div class="setting-info">
              <i class="fas fa-bell"></i>
              <span>消息通知</span>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
          
          <div class="setting-item" @click="navigateTo('privacy')">
            <div class="setting-info">
              <i class="fas fa-shield-alt"></i>
              <span>隐私设置</span>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
          
          <div class="setting-item" @click="navigateTo('about')">
            <div class="setting-info">
              <i class="fas fa-info-circle"></i>
              <span>关于我们</span>
            </div>
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      </el-card>

      <!-- 快速操作 -->
      <el-card class="quick-actions" shadow="hover">
        <template #header>
          <h3 class="actions-title">快速操作</h3>
        </template>
        
        <div class="actions-grid">
          <el-button type="primary" class="action-btn" @click="$router.push('/creation')">
            <i class="fas fa-pen-fancy"></i>
            开始创作
          </el-button>
          <el-button type="success" class="action-btn" @click="$router.push('/favorites')">
            <i class="fas fa-heart"></i>
            查看收藏
          </el-button>
          <el-button type="info" class="action-btn" @click="$router.push('/')">
            <i class="fas fa-home"></i>
            返回首页
          </el-button>
        </div>
      </el-card>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const userStats = ref({
  favorites: 12,
  creations: 3,
  views: 24
})

const navigateTo = (section) => {
  ElMessage.info(`跳转到${getSectionName(section)}`)
}

const getSectionName = (section) => {
  const names = {
    account: '账号设置',
    notifications: '消息通知',
    privacy: '隐私设置',
    about: '关于我们'
  }
  return names[section] || '该页面'
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f9f9f9;
}

.page-header {
  background: #1f2937;
  color: white;
  padding: 16px 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  color: white !important;
  font-size: 18px;
  padding: 8px;
}

.profile-main {
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card, .settings-card, .quick-actions {
  border-radius: 12px;
}

.user-info {
  padding: 20px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar i {
  font-size: 32px;
  color: #6b7280;
}

.user-details h3 {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.user-stats {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  background: #f3f4f6;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.settings-title, .actions-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.3s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background-color: #f9fafb;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-info i:first-child {
  color: #6b7280;
  width: 20px;
}

.setting-info span {
  color: #374151;
  font-size: 16px;
}

.setting-item i:last-child {
  color: #9ca3af;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.action-btn i {
  margin-right: 8px;
}
</style>