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
          <el-button 
            type="danger" 
            size="small" 
            @click="clearAllFavorites"
            :disabled="favoritePoems.length === 0">
            <i class="fas fa-trash"></i>
            清空收藏
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="favorites-main">
      <div class="favorites-header">
        <h2 class="section-title">收藏的诗词 ({{ favoritePoems.length }})</h2>
        <div class="filters">
          <el-select v-model="sortBy" placeholder="排序方式" size="small">
            <el-option label="按收藏时间" value="time" />
            <el-option label="按诗词标题" value="title" />
            <el-option label="按作者" value="author" />
          </el-select>
        </div>
      </div>
      
      <div class="poems-grid">
        <el-card 
          v-for="poem in sortedPoems" 
          :key="poem.id" 
          class="poem-card"
          shadow="hover">
          <div class="card-header">
            <h3 class="poem-title">{{ poem.title }}</h3>
            <div class="card-actions">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="viewPoemDetail(poem)"
                class="view-btn">
                <i class="fas fa-eye"></i>
                查看
              </el-button>
              <el-button 
                type="text" 
                size="small" 
                @click.stop="removeFromFavorites(poem.id)"
                class="remove-btn">
                <i class="fas fa-trash"></i>
                移除
              </el-button>
            </div>
          </div>
          <div class="card-image">
            <img :src="poem.image" :alt="poem.title" class="poem-image" />
          </div>
          <div class="card-content">
            <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
            <p class="poem-content">{{ poem.content }}</p>
            <div class="poem-tags">
              <el-tag 
                v-for="tag in poem.tags" 
                :key="tag" 
                size="small"
                type="info">
                {{ tag }}
              </el-tag>
            </div>
            <div class="favorite-info">
              <span class="favorite-time">
                <i class="fas fa-clock"></i>
                收藏于 {{ formatDate(poem.favoriteTime) }}
              </span>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="favoritePoems.length === 0" class="empty-state">
        <el-empty description="暂无收藏的诗词">
          <el-button type="primary" @click="goToHome">
            <i class="fas fa-home"></i>
            去首页发现诗词
          </el-button>
        </el-empty>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const sortBy = ref('time')

// 从localStorage加载收藏数据
const favoritePoems = ref([])

const sortedPoems = computed(() => {
  const poems = [...favoritePoems.value]
  
  switch (sortBy.value) {
    case 'title':
      return poems.sort((a, b) => a.title.localeCompare(b.title))
    case 'author':
      return poems.sort((a, b) => a.author.localeCompare(b.author))
    case 'time':
    default:
      return poems.sort((a, b) => new Date(b.favoriteTime) - new Date(a.favoriteTime))
  }
})

// 加载收藏数据
const loadFavorites = () => {
  try {
    const stored = localStorage.getItem('poetry_favorites')
    if (stored) {
      favoritePoems.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载收藏数据失败:', error)
    favoritePoems.value = []
  }
}

// 保存收藏数据到localStorage
const saveFavorites = () => {
  try {
    localStorage.setItem('poetry_favorites', JSON.stringify(favoritePoems.value))
  } catch (error) {
    console.error('保存收藏数据失败:', error)
  }
}

// 查看诗词详情
const viewPoemDetail = (poem) => {
  router.push(`/poem/${poem.id}`)
}

// 移除收藏
const removeFromFavorites = async (poemId) => {
  try {
    await ElMessageBox.confirm('确定要移除这首诗词的收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    favoritePoems.value = favoritePoems.value.filter(poem => poem.id !== poemId)
    saveFavorites()
    ElMessage.success('已移除收藏')
  } catch (error) {
    // 用户取消操作
  }
}

// 清空所有收藏
const clearAllFavorites = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有收藏吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    
    favoritePoems.value = []
    saveFavorites()
    ElMessage.success('已清空所有收藏')
  } catch (error) {
    // 用户取消操作
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 跳转到首页
const goToHome = () => {
  router.push('/')
}

onMounted(() => {
  loadFavorites()
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

.favorites-main {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.poems-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.poem-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.poem-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 0;
  margin-bottom: 12px;
}

.poem-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.view-btn, .remove-btn {
  padding: 4px 8px;
  font-size: 12px;
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

.poem-meta {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.poem-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.favorite-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
}

.favorite-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .favorites-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .poems-grid {
    grid-template-columns: 1fr;
  }
}
</style>