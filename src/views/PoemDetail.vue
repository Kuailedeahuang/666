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
          </div>
        </el-card>
      </div>
    </main>
  </div>
  
  <div v-else class="loading-container">
    <el-empty description="诗词不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePoetryStore } from '../stores/poetry'
import { ElMessage } from 'element-plus'

const router = useRouter()
const poetryStore = usePoetryStore()

const currentPoem = ref(null)
const aiAnalysis = ref('')

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

const regenerateAnalysis = () => {
  if (currentPoem.value) {
    aiAnalysis.value = generateAIAnalysis(currentPoem.value)
    ElMessage.success('AI赏析已重新生成')
  }
}

const addToFavorites = () => {
  ElMessage.success('赏析已添加到收藏')
}

onMounted(() => {
  currentPoem.value = poetryStore.currentPoem
  if (currentPoem.value) {
    aiAnalysis.value = generateAIAnalysis(currentPoem.value)
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