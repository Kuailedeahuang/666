<template>
  <div class="poem-detail-container" v-if="currentPoem">
    <!-- 导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="font-logo text-xl">诗韵赏析</span>
          <h1 class="page-title">诗词详情</h1>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            返回
          </el-button>
        </div>
      </div>
    </header>

    <!-- 诗词详情内容 -->
    <main class="poem-detail-main">
      <div class="poem-hero">
        <div class="poem-basic-info">
          <h1 class="poem-title">{{ currentPoem.title }}</h1>
          <div class="poem-meta">
            <span class="dynasty-tag">{{ currentPoem.dynasty }}</span>
            <span class="author">作者：{{ currentPoem.author }}</span>
          </div>
        </div>
      </div>

      <!-- 诗词内容区域 -->
      <div class="content-section">
        <!-- 原文展示 -->
        <el-card class="original-section" shadow="hover">
          <template #header>
            <h3 class="section-title">
              <i class="fas fa-book"></i>
              原文
            </h3>
          </template>
          <div class="poem-text">
            <p v-for="(line, index) in poemLines" :key="index" class="poem-line">
              {{ line }}
            </p>
          </div>
        </el-card>

        <!-- AI赏析 -->
        <el-card class="analysis-section" shadow="hover">
          <template #header>
            <h3 class="section-title">
              <i class="fas fa-robot"></i>
              AI智能赏析
            </h3>
          </template>
          <div class="analysis-content">
            <p>{{ aiAnalysis }}</p>
          </div>
          <div class="analysis-actions">
            <el-button type="primary" size="small" @click="regenerateAnalysis">
              <i class="fas fa-sync"></i>
              重新生成
            </el-button>
            <el-button type="success" size="small" @click="addToFavorites">
              <i class="fas fa-heart"></i>
              收藏赏析
            </el-button>
          </div>
        </el-card>

        <!-- 相关信息 -->
        <el-card class="info-section" shadow="hover">
          <template #header>
            <h3 class="section-title">
              <i class="fas fa-info-circle"></i>
              相关信息
            </h3>
          </template>
          <div class="info-content">
            <div class="info-item">
              <span class="info-label">朝代：</span>
              <span class="info-value">{{ currentPoem.dynasty }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作者：</span>
              <span class="info-value">{{ currentPoem.author }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">标签：</span>
              <div class="tags">
                <el-tag
                  v-for="tag in currentPoem.tags"
                  :key="tag"
                  type="info"
                  size="small"
                  class="tag">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">浏览量：</span>
              <span class="info-value">{{ currentPoem.views || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">点赞数：</span>
              <span class="info-value">{{ currentPoem.like_count || 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">评论数：</span>
              <span class="info-value">{{ currentPoem.comment_count || 0 }}</span>
            </div>
          </div>
        </el-card>

        <!-- 操作按钮 -->
        <el-card class="actions-section" shadow="hover">
          <template #header>
            <h3 class="section-title">
              <i class="fas fa-cog"></i>
              操作
            </h3>
          </template>
          <div class="actions-content">
            <el-button type="primary" @click="addToFavorites" class="action-btn">
              <i class="fas fa-heart"></i>
              收藏
            </el-button>
            <el-button type="success" @click="sharePoem" class="action-btn">
              <i class="fas fa-share"></i>
              分享
            </el-button>
            <el-button type="info" @click="regenerateAnalysis" class="action-btn">
              <i class="fas fa-sync"></i>
              重新生成赏析
            </el-button>
            <el-button v-if="isUserPoem" type="warning" @click="editPoem" class="action-btn">
              <i class="fas fa-edit"></i>
              编辑
            </el-button>
            <el-button v-if="isUserPoem" type="danger" @click="deletePoem" class="action-btn">
              <i class="fas fa-trash"></i>
              删除
            </el-button>
          </div>
        </el-card>
      </div>
    </main>
  </div>
  
  <div v-else-if="loading" class="loading-container">
    <el-skeleton :rows="6" animated />
  </div>
  <div v-else class="loading-container">
    <el-empty description="诗词不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePoetryStore } from '../stores/poetry'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getImageByPoemId } from '../config/images.js'

const router = useRouter()
const route = useRoute()
const poetryStore = usePoetryStore()

const currentPoem = ref(null)
const aiAnalysis = ref('')
const loading = ref(false)

// 检查是否是用户创作的诗词
const isUserPoem = computed(() => {
  if (!currentPoem.value) return false
  const userPoems = JSON.parse(localStorage.getItem('user_poems') || '[]')
  return userPoems.some(p => p.id === currentPoem.value.id)
})

const poemLines = computed(() => {
  if (!currentPoem.value) return []
  return currentPoem.value.content.split('。').filter(line => line.trim())
})

// 模拟AI赏析内容
const generateAIAnalysis = (poem) => {
  const analyses = {
    1: '《静夜思》是李白最著名的诗作之一。诗人通过"床前明月光"的细腻描写，将月光比作地上的霜，营造出清冷寂静的夜晚氛围。"举头望明月，低头思故乡"两句，通过简单的动作描写，深刻表达了游子对故乡的深切思念。全诗语言质朴自然，意境深远，是思乡诗的典范之作。',
    2: '《春晓》以清新自然的笔触描绘春日早晨的景象。诗人通过"春眠不觉晓"展现春日的慵懒舒适，"处处闻啼鸟"则生动表现了春天的生机勃勃。后两句"夜来风雨声，花落知多少"巧妙地将听觉与想象结合，既写出了夜雨的实景，又引发对落花的怜惜，体现了诗人对自然变化的敏锐观察。',
    3: '《登鹳雀楼》是一首气势恢宏的登高诗。前两句"白日依山尽，黄河入海流"以壮阔的笔触描绘山河景象，展现大自然的雄伟壮观。后两句"欲穷千里目，更上一层楼"则从写景转入抒情，表达了不断进取、追求更高境界的人生哲理，成为千古传诵的名句。',
    4: '《相思》是王维爱情诗的代表作。诗人借"红豆"这一传统意象，含蓄表达相思之情。"春来发几枝"既写实又寓意，暗示相思之情的生长。"愿君多采撷，此物最相思"直接抒发情感，语言真挚动人。全诗含蓄隽永，情感深沉，是爱情诗的经典。',
    5: '《江雪》描绘了一幅冬日江雪的寂静画面。前两句"千山鸟飞绝，万径人踪灭"以夸张手法渲染环境的极度寂静，后两句"孤舟蓑笠翁，独钓寒江雪"则聚焦于渔翁的形象，通过对比突出其孤独坚毅。全诗意境清冷孤寂，体现了诗人超然物外的人生态度。'
  }
  return analyses[poem.id] || '这首诗词意境深远，语言优美，值得细细品味。其中蕴含的深刻情感和人生哲理，展现了中华诗词的独特魅力。'
}

// 获取诗词详情
const fetchPoemDetail = async (poemId) => {
  try {
    loading.value = true
    
    // 首先检查是否是用户创作的诗词
    const userPoems = JSON.parse(localStorage.getItem('user_poems') || '[]')
    const userPoem = userPoems.find(p => p.id === parseInt(poemId))
    
    if (userPoem) {
      currentPoem.value = userPoem
      aiAnalysis.value = generateAIAnalysis(currentPoem.value)
      return
    }
    
    // 如果不是用户创作的，尝试从API获取
    const response = await fetch(`/api/poetry/${poemId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    currentPoem.value = data.poem
    
    if (currentPoem.value) {
      aiAnalysis.value = generateAIAnalysis(currentPoem.value)
    }
  } catch (error) {
    console.error('获取诗词详情失败:', error)
    
    // 如果API调用失败，使用示例数据
    const samplePoems = [
      {
        id: 1,
        title: '静夜思',
        author: '李白',
        dynasty: '唐',
        content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
        tags: ['思乡', '月亮', '夜晚'],
        views: 1560,
        like_count: 234,
        comment_count: 45
      },
      {
        id: 2,
        title: '春晓',
        author: '孟浩然',
        dynasty: '唐',
        content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
        tags: ['春天', '自然', '生活'],
        views: 1280,
        like_count: 189,
        comment_count: 32
      },
      {
        id: 3,
        title: '登鹳雀楼',
        author: '王之涣',
        dynasty: '唐',
        content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
        tags: ['登高', '壮丽', '哲理'],
        views: 980,
        like_count: 156,
        comment_count: 28
      }
    ]
    
    const poem = samplePoems.find(p => p.id === parseInt(poemId))
    if (poem) {
      currentPoem.value = poem
      aiAnalysis.value = generateAIAnalysis(poem)
    } else {
      ElMessage.error('诗词不存在')
    }
  } finally {
    loading.value = false
  }
}

const regenerateAnalysis = () => {
  if (currentPoem.value) {
    aiAnalysis.value = generateAIAnalysis(currentPoem.value)
    ElMessage.success('AI赏析已重新生成')
  }
}

const addToFavorites = () => {
  if (!currentPoem.value) return
  
  try {
    // 从localStorage加载现有收藏
    const stored = localStorage.getItem('poetry_favorites')
    let favorites = stored ? JSON.parse(stored) : []
    
    // 检查是否已经收藏
    const existingIndex = favorites.findIndex(fav => fav.id === currentPoem.value.id)
    
    if (existingIndex !== -1) {
      ElMessage.info('这首诗词已经在收藏中了')
      return
    }
    
    // 添加收藏信息
    const favoritePoem = {
      ...currentPoem.value,
      favoriteTime: new Date().toISOString()
    }
    
    favorites.unshift(favoritePoem) // 添加到开头
    
    // 保存到localStorage
    localStorage.setItem('poetry_favorites', JSON.stringify(favorites))
    ElMessage.success('已添加到收藏')
  } catch (error) {
    console.error('添加收藏失败:', error)
    ElMessage.error('添加收藏失败，请重试')
  }
}

const sharePoem = () => {
  if (navigator.share) {
    navigator.share({
      title: currentPoem.value.title,
      text: `${currentPoem.value.title} - ${currentPoem.value.author}`,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    ElMessage.success('链接已复制到剪贴板')
  }
}

const editPoem = () => {
  ElMessage.info('编辑功能开发中...')
}

const deletePoem = () => {
  if (!currentPoem.value) return
  
  ElMessageBox.confirm(
    '确定要删除这首诗词吗？此操作不可恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const userPoems = JSON.parse(localStorage.getItem('user_poems') || '[]')
    const updatedPoems = userPoems.filter(p => p.id !== currentPoem.value.id)
    localStorage.setItem('user_poems', JSON.stringify(updatedPoems))
    
    ElMessage.success('诗词已删除')
    router.push('/')
  }).catch(() => {
    // 用户取消删除
  })
}

onMounted(() => {
  const poemId = route.params.id
  if (poemId) {
    fetchPoemDetail(poemId)
  }
})

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchPoemDetail(newId)
  }
})

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.poem-detail-container {
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

.back-btn {
  color: white;
  border-color: white;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.poem-detail-main {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.poem-hero {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
}

.poem-title {
  font-size: 36px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.poem-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.dynasty-tag {
  background: #3b82f6;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.author {
  font-size: 18px;
  color: #6b7280;
}

.content-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.original-section, .analysis-section, .info-section {
  border-radius: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.poem-text {
  font-size: 18px;
  line-height: 2;
  color: #374151;
  text-align: center;
}

.poem-line {
  margin: 8px 0;
}

.analysis-content {
  font-size: 16px;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 20px;
}

.analysis-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-label {
  font-weight: 600;
  color: #374151;
  min-width: 60px;
}

.info-value {
  color: #6b7280;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 12px;
}

.loading-container {
  padding: 100px 0;
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .content-section {
    grid-template-columns: 1fr 1fr;
  }
  
  .original-section {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .content-section {
    grid-template-columns: 2fr 1fr;
  }
  
  .original-section {
    grid-column: 1;
  }
  
  .analysis-section {
    grid-column: 2;
    grid-row: 1 / 3;
  }
  
  .info-section {
    grid-column: 1;
  }
}
</style>