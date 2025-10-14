<template>
  <div class="favorites-container">
    <!-- 导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="font-logo text-xl">诗韵赏析</span>
          <h1 class="page-title">我的收藏</h1>
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

    <!-- 主内容 -->
    <main class="favorites-main">
      <h2 class="section-title">收藏的诗词</h2>
      
      <div class="poems-grid">
        <el-card 
          v-for="poem in favoritePoems" 
          :key="poem.id" 
          class="poem-card"
          shadow="hover">
          <div class="card-image">
            <img :src="poem.image" :alt="poem.title" class="poem-image" />
          </div>
          <div class="card-content">
            <h3 class="poem-title">{{ poem.title }}</h3>
            <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
            <p class="poem-content">{{ poem.content }}</p>
          </div>
        </el-card>
      </div>

      <div v-if="favoritePoems.length === 0" class="empty-state">
        <el-empty description="暂无收藏的诗词" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const favoritePoems = ref([
  {
    id: 1,
    title: '梅花',
    author: '王安石',
    dynasty: '宋代',
    content: '墙角数枝梅，凌寒独自开。遥知不是雪，为有暗香来。',
    image: 'https://ai-public.mastergo.com/ai/img_res/4575dd21f53cf2bdae389e523f74ef43.jpg'
  },
  {
    id: 2,
    title: '咏柳',
    author: '贺知章',
    dynasty: '唐代',
    content: '碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出，二月春风似剪刀。',
    image: 'https://ai-public.mastergo.com/ai/img_res/b172092099a902fd1223ef757c2bac1b.jpg'
  }
])

onMounted(() => {
  // 可以在这里加载用户收藏数据
})
</script>

<style scoped>
.favorites-container {
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

.favorites-main {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 24px;
}

.poems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.poem-card {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.poem-card:hover {
  transform: translateY(-4px);
}

.card-image {
  height: 160px;
  overflow: hidden;
}

.poem-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 16px;
}

.poem-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.poem-meta {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.poem-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>