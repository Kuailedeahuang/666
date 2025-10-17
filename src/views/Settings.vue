<template>
  <div class="settings-container">
    <!-- 导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="font-logo text-xl">诗韵赏析</span>
          <h1 class="page-title">{{ currentSectionTitle }}</h1>
        </div>
        <div class="header-actions">
          <el-button text class="action-btn" @click="$router.back()">
            <i class="fas fa-arrow-left"></i>
          </el-button>
        </div>
      </div>
    </header>

    <!-- 设置内容 -->
    <main class="settings-main">
      <!-- 账号设置 -->
      <div v-if="currentSection === 'account'" class="section-content">
        <el-card shadow="hover" class="setting-card">
          <template #header>
            <h3>账号信息</h3>
          </template>
          <div class="form-group">
            <label>用户名</label>
            <el-input v-model="userInfo.username" placeholder="请输入用户名"></el-input>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <el-input v-model="userInfo.email" placeholder="请输入邮箱"></el-input>
          </div>
          <div class="form-group">
            <label>个人简介</label>
            <el-input 
              type="textarea" 
              v-model="userInfo.bio" 
              placeholder="请输入个人简介"
              :rows="3"
            ></el-input>
          </div>
          <el-button type="primary" @click="saveAccountSettings">保存更改</el-button>
        </el-card>
      </div>

      <!-- 消息通知 -->
      <div v-if="currentSection === 'notifications'" class="section-content">
        <el-card shadow="hover" class="setting-card">
          <template #header>
            <h3>消息通知设置</h3>
          </template>
          <div class="setting-item">
            <div class="setting-info">
              <span>新诗词通知</span>
              <span class="setting-desc">当有新的诗词发布时通知我</span>
            </div>
            <el-switch v-model="notificationSettings.newPoems"></el-switch>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span>评论回复通知</span>
              <span class="setting-desc">当有人回复我的评论时通知我</span>
            </div>
            <el-switch v-model="notificationSettings.commentReplies"></el-switch>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span>点赞通知</span>
              <span class="setting-desc">当有人点赞我的诗词时通知我</span>
            </div>
            <el-switch v-model="notificationSettings.likes"></el-switch>
          </div>
          <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
        </el-card>
      </div>

      <!-- 隐私设置 -->
      <div v-if="currentSection === 'privacy'" class="section-content">
        <el-card shadow="hover" class="setting-card">
          <template #header>
            <h3>隐私设置</h3>
          </template>
          <div class="setting-item">
            <div class="setting-info">
              <span>公开个人资料</span>
              <span class="setting-desc">允许其他用户查看我的个人资料</span>
            </div>
            <el-switch v-model="privacySettings.publicProfile"></el-switch>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span>显示收藏列表</span>
              <span class="setting-desc">允许其他用户查看我收藏的诗词</span>
            </div>
            <el-switch v-model="privacySettings.showFavorites"></el-switch>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span>显示创作列表</span>
              <span class="setting-desc">允许其他用户查看我创作的诗词</span>
            </div>
            <el-switch v-model="privacySettings.showCreations"></el-switch>
          </div>
          <el-button type="primary" @click="savePrivacySettings">保存设置</el-button>
        </el-card>
      </div>

      <!-- 关于我们 -->
      <div v-if="currentSection === 'about'" class="section-content">
        <el-card shadow="hover" class="setting-card">
          <template #header>
            <h3>关于诗韵赏析</h3>
          </template>
          <div class="about-content">
            <p>诗韵赏析是一个专注于中国古典诗词的在线赏析平台，致力于为用户提供优质的诗词阅读和分享体验。</p>
            
            <h4>主要功能</h4>
            <ul>
              <li>📚 丰富的诗词库，涵盖唐诗、宋词、元曲等</li>
              <li>🔍 智能搜索和分类浏览</li>
              <li>❤️ 个人收藏和创作管理</li>
              <li>💬 诗词评论和交流</li>
              <li>🎨 精美的诗词展示界面</li>
            </ul>

            <h4>版本信息</h4>
            <p>当前版本：v1.0.0</p>
            <p>更新日期：2024年10月</p>

            <h4>联系我们</h4>
            <p>如有问题或建议，请联系我们：</p>
            <p>邮箱：support@poetry.com</p>
          </div>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const currentSection = ref('account')

// 用户信息
const userInfo = ref({
  username: '诗词爱好者',
  email: 'user@poetry.com',
  bio: '热爱古典诗词的文学爱好者'
})

// 通知设置
const notificationSettings = ref({
  newPoems: true,
  commentReplies: true,
  likes: true
})

// 隐私设置
const privacySettings = ref({
  publicProfile: true,
  showFavorites: true,
  showCreations: false
})

// 计算当前页面的标题
const currentSectionTitle = computed(() => {
  const titles = {
    account: '账号设置',
    notifications: '消息通知',
    privacy: '隐私设置',
    about: '关于我们'
  }
  return titles[currentSection.value] || '设置'
})

// 保存账号设置
const saveAccountSettings = () => {
  ElMessage.success('账号设置已保存')
  // 这里可以添加实际的保存逻辑
}

// 保存通知设置
const saveNotificationSettings = () => {
  ElMessage.success('通知设置已保存')
  // 这里可以添加实际的保存逻辑
}

// 保存隐私设置
const savePrivacySettings = () => {
  ElMessage.success('隐私设置已保存')
  // 这里可以添加实际的保存逻辑
}

onMounted(() => {
  // 从路由参数获取当前设置项
  if (route.params.section) {
    currentSection.value = route.params.section
  }
})
</script>

<style scoped>
.settings-container {
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

.settings-main {
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.section-content {
  animation: fadeIn 0.3s ease-in-out;
}

.setting-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.setting-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-info span:first-child {
  font-weight: 500;
  color: #374151;
}

.setting-desc {
  font-size: 14px;
  color: #6b7280;
}

.about-content {
  line-height: 1.6;
  color: #374151;
}

.about-content h4 {
  margin: 20px 0 12px 0;
  color: #111827;
}

.about-content ul {
  margin: 12px 0;
  padding-left: 20px;
}

.about-content li {
  margin-bottom: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>