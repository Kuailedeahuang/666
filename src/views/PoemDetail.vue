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

// 详细的AI赏析内容
const generateAIAnalysis = (poem) => {
  const detailedAnalyses = {
    // 李白诗词
    'aa64e4a1-908d-44d2-ad57-4467ebfa40d9': `《望庐山瀑布》是李白山水诗的代表作之一，充分展现了诗人浪漫主义的艺术风格。

【创作背景】这首诗创作于唐玄宗开元年间，李白游历庐山时所作。庐山作为道教名山，其壮丽的自然景观激发了诗人的创作灵感。

【艺术特色】
1. 夸张手法：诗人运用"飞流直下三千尺"的夸张描写，将瀑布的雄伟气势表现得淋漓尽致
2. 比喻精妙："疑是银河落九天"将瀑布比作银河，想象奇特，意境开阔
3. 色彩对比："紫烟"与"白瀑"形成鲜明对比，增强了画面的层次感

【主题思想】通过描绘庐山瀑布的壮丽景象，表达了诗人对大自然的热爱和赞美，同时也体现了李白豪放不羁的个性特征。

【语言特色】语言简洁明快，对仗工整，音韵和谐。前两句写实，后两句写意，虚实结合，相得益彰。

【历史地位】这首诗被誉为"山水诗的巅峰之作"，对后世山水诗创作产生了深远影响。`,
    
    '4e5f1f2e-9924-4695-8c5f-5936597894c2': `《登鹳雀楼》是王之涣的代表作，以其雄浑的气势和深刻的哲理闻名于世。

【创作背景】创作于唐代，鹳雀楼位于今山西永济，是当时的登高胜地。诗人登楼远眺，触景生情而作。

【艺术手法】
1. 对仗工整：前两句"白日依山尽，黄河入海流"形成完美的对仗
2. 意境开阔：通过"千里目"、"更上一层"等词语，展现了宏大的空间感
3. 哲理深刻：从写景自然过渡到说理，毫无斧凿痕迹

【主题解析】表面写登高望远，实则蕴含深刻的人生哲理。鼓励人们不断进取，追求更高的境界。

【语言特色】语言简练，意象鲜明。短短二十字，却包含了丰富的内涵和深刻的哲理。

【文学价值】这首诗被誉为"登高诗的典范"，其"欲穷千里目，更上一层楼"成为千古名句。`,
    
    '46616ea1-0363-4d00-b744-55f848751890': `《夜雨寄北》是李商隐爱情诗的代表作，以其深情绵邈、意境朦胧著称。

【创作背景】这首诗是诗人在巴蜀期间写给北方妻子的作品，表达了深切的思念之情。

【艺术特色】
1. 时空交错：将现实中的巴山夜雨与想象中的西窗剪烛巧妙结合
2. 回环结构："巴山夜雨"在诗中重复出现，形成独特的韵律美
3. 虚实相生：现实与想象交织，增强了诗歌的感染力

【情感表达】通过夜雨秋池的意象，烘托出诗人内心的孤寂和思念，情感真挚动人。

【语言风格】语言含蓄隽永，意象优美，体现了李商隐诗歌"深情绵邈"的特点。

【文学影响】这首诗对后世爱情诗创作产生了重要影响，被誉为"爱情诗的经典之作"。`,

    // 苏轼诗词
    'b65e4400-57e8-46f5-9f80-149a9cd82a8d': `《水调歌头·明月几时有》是苏轼中秋词的巅峰之作，体现了词人豁达的人生态度。

【创作背景】创作于宋神宗熙宁九年中秋，词人怀念弟弟苏辙而作，表达了对亲人的思念和对人生的思考。

【艺术成就】
1. 想象奇特：从问月到欲乘风归去，展现了丰富的想象力
2. 哲理深刻："人有悲欢离合，月有阴晴圆缺"蕴含深刻的人生哲理
3. 意境开阔：将个人情感与宇宙意识相结合，境界宏大

【主题思想】既表达了兄弟之情，又抒发了对人生的感悟，体现了苏轼"旷达"的人生态度。

【语言特色】语言流畅自然，音韵和谐，既有文人词的雅致，又不失民歌的清新。

【历史地位】这首词被誉为"中秋词之冠"，对宋词发展产生了重要影响。`,

    // 李清照诗词
    'ab04b232-5f75-4268-9be4-f5bb4a888851': `《醉花阴·薄雾浓云愁永昼》是李清照婉约词的代表作，以其细腻的情感描写著称。

【创作背景】创作于词人婚后，丈夫赵明诚外出任职期间，表达了深切的思念之情。

【艺术特色】
1. 意象精美："薄雾浓云"、"瑞脑金兽"等意象营造出凄美的意境
2. 对比手法：将外在景物与内心情感形成鲜明对比
3. 语言精炼："人比黄花瘦"堪称词眼，形象生动

【情感表达】通过重阳节的景物描写，委婉地表达了闺中少妇的寂寞和思念，情感细腻真挚。

【女性视角】以女性特有的敏感和细腻，展现了闺阁生活的真实情感，具有独特的艺术价值。

【文学影响】这首词对后世婉约词创作产生了深远影响，是宋词中的经典之作。`,

    // 通用赏析模板
    'default': `【诗词概况】${poem.title}是${poem.author}在${poem.dynasty}时期创作的一首优秀诗作。

【内容赏析】这首诗${poem.content}，通过生动的意象和优美的语言，表达了深刻的思想感情。

【艺术特色】
1. 语言${poem.tags && poem.tags.length > 0 ? `运用了${poem.tags.join('、')}等手法` : '简洁明快'}
2. 意境${poem.theme ? `围绕"${poem.theme}"主题展开` : '深远悠长'}
3. 情感表达${poem.author === '李白' ? '豪放洒脱' : poem.author === '杜甫' ? '沉郁顿挫' : '真挚动人'}

【文学价值】这首诗在${poem.dynasty}诗歌中具有重要地位，对后世文学创作产生了${poem.difficulty_level > 2 ? '深远' : '一定'}的影响。

【个人感悟】阅读这首诗，让人感受到中华诗词的独特魅力和${poem.author}卓越的艺术才华。`
  }

  // 优先使用具体诗词的详细赏析
  if (detailedAnalyses[poem.id]) {
    return detailedAnalyses[poem.id]
  }

  // 根据诗词特征匹配赏析
  if (poem.title.includes('静夜思')) {
    return `《静夜思》是李白最著名的五言绝句，以其质朴的语言和深远的意境成为千古绝唱。

【创作背景】创作于诗人漂泊异乡期间，通过月夜思乡的寻常题材，表达了游子共同的思乡之情。

【艺术特色】
1. 语言质朴：全诗二十字，无一难字，却意境深远
2. 对比鲜明："疑是地上霜"的错觉与"举头望明月"的清醒形成对比
3. 动作连贯："举头"、"低头"两个动作自然流畅，情感真挚

【主题思想】通过月夜思乡的描写，表达了人类共通的思乡情感，具有普遍的人文关怀。

【文学影响】这首诗被誉为"思乡诗的典范"，其简洁明快的风格对后世诗歌创作产生了重要影响。`
  }

  if (poem.title.includes('春晓')) {
    return `《春晓》是孟浩然的代表作，以其清新自然的风格描绘了春日早晨的生动画面。

【艺术手法】
1. 听觉描写："处处闻啼鸟"通过声音表现春日的生机
2. 联想巧妙：从"风雨声"联想到"花落知多少"
3. 语言简练：二十字中包含丰富的春天气息

【主题特色】通过春日早晨的细微观察，表达了诗人对自然的热爱和对生命的珍惜。`
  }

  // 返回通用赏析或默认赏析
  return detailedAnalyses['default']
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