<template>
  <div class="home-container">
    <!-- 轮播图区域 -->
    <section class="banner-section">
      <div class="banner-content">
        <div class="banner-text">
          <h2 class="poem-title">《静夜思》</h2>
          <p class="poem-author">李白 · 唐代</p>
          <p class="poem-content">床前明月光，疑是地上霜。举头望明月，低头思故乡。</p>
        </div>
      </div>
    </section>

    <!-- 分类标签导航 -->
    <nav class="category-nav">
      <div class="nav-container">
        <button 
          v-for="category in categories" 
          :key="category"
          :class="['category-btn', { active: selectedCategory === category }]"
          @click="handleCategoryChange(category)">
          {{ category }}
        </button>
      </div>
    </nav>

    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索诗词、作者或关键词..."
          size="large"
          class="search-input"
          @input="handleSearch"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          clearable>
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </el-input>
        
        <!-- 搜索建议 -->
        <div v-if="showSuggestions && searchSuggestions.length > 0" class="suggestions-dropdown">
          <div 
            v-for="suggestion in searchSuggestions" 
            :key="suggestion"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)">
            <i class="fas fa-search"></i>
            {{ suggestion }}
          </div>
        </div>
        
        <!-- 热门搜索 -->
        <div v-if="showSuggestions && searchQuery === ''" class="popular-searches">
          <h4 class="popular-title">热门搜索</h4>
          <div class="popular-tags">
            <el-tag
              v-for="item in popularSearches"
              :key="item.query"
              type="info"
              class="popular-tag"
              @click="selectPopularSearch(item.query)">
              {{ item.query }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门诗词列表 -->
    <main class="poems-section">
      <h2 class="section-title">{{ searchQuery ? '搜索结果' : '热门诗词' }}</h2>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>
      
      <!-- 诗词列表 -->
      <div v-else class="poems-grid">
        <el-card 
          v-for="poem in enhancedPoems" 
          :key="poem.id" 
          class="poem-card"
          shadow="hover"
          @click="viewPoemDetail(poem)">
          <div class="card-content">
            <div class="card-header">
              <h3 class="poem-title">{{ poem.title }}</h3>
              <el-button 
                type="text" 
                size="small" 
                class="favorite-btn"
                @click.stop="toggleFavorite(poem)">
                <i class="fas" :class="isFavorite(poem.id) ? 'fa-heart text-red-500' : 'fa-heart'"></i>
              </el-button>
            </div>
            <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
            <p class="poem-text">{{ poem.content }}</p>
            <div class="poem-tags">
              <span v-for="tag in poem.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 无结果提示 -->
      <div v-if="!loading && enhancedPoems.length === 0" class="no-results">
        <el-empty description="未找到相关诗词" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getImageByPoemId } from '../config/images.js'

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('全部')
const poems = ref([])
const loading = ref(false)
const showSuggestions = ref(false)
const searchSuggestions = ref([])
const popularSearches = ref([])

// 使用配置的图片URL
const imageUrls = [
  'https://ai-public.mastergo.com/ai/img_res/4575dd21f53cf2bdae389e523f74ef43.jpg',
  'https://ai-public.mastergo.com/ai/img_res/b172092099a902fd1223ef757c2bac1b.jpg',
  'https://ai-public.mastergo.com/ai/img_res/d84620fed18dfcdfb6de84ba5647efc5.jpg',
  'https://ai-public.mastergo.com/ai/img_res/787976d0905dc82babc5202a4b9cf69e.jpg',
  'https://ai-public.mastergo.com/ai/img_res/722337332f17e449e3e27625e0f07e81.jpg'
]

// 分类与朝代的映射关系
const categoryToDynasty = {
  '全部': '',
  '唐诗': '唐',
  '宋词': '宋',
  '元曲': '元',
  '现代诗': '现代',
  '山水诗': '',
  '边塞诗': ''
}

const categories = ref(['全部', '唐诗', '宋词', '元曲', '现代诗', '山水诗', '边塞诗'])

// 获取搜索建议
const fetchSearchSuggestions = async (query) => {
  if (!query || query.trim() === '') {
    searchSuggestions.value = []
    return
  }
  
  try {
    const response = await fetch(`/api/poetry/search/suggestions?query=${encodeURIComponent(query)}`)
    if (response.ok) {
      const data = await response.json()
      searchSuggestions.value = data.suggestions || []
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    searchSuggestions.value = []
  }
}

// 获取热门搜索
const fetchPopularSearches = async () => {
  try {
    const response = await fetch('/api/poetry/search/popular?limit=8')
    if (response.ok) {
      const data = await response.json()
      popularSearches.value = data.popularSearches || []
    }
  } catch (error) {
    console.error('获取热门搜索失败:', error)
    popularSearches.value = [
      { query: '李白', count: 156 },
      { query: '唐诗', count: 134 },
      { query: '爱情', count: 98 },
      { query: '春天', count: 87 }
    ]
  }
}

// 从后端API获取诗词数据（用于首页展示）
const fetchPoems = async () => {
  try {
    loading.value = true
    
    // 根据当前选择的分类决定调用哪个API
    const dynasty = categoryToDynasty[selectedCategory.value]
    const category = selectedCategory.value
    
    let response
    
    if (dynasty) {
      // 如果选择了特定朝代，使用朝代过滤API
      response = await fetch(`/api/poetry/?dynasty=${dynasty}&limit=12`)
    } else if (category === '山水诗' || category === '边塞诗') {
      // 如果选择了主题分类，使用分类过滤API
      response = await fetch(`/api/poetry/?category=${encodeURIComponent(category)}&limit=12`)
    } else {
      // 否则使用随机诗词API
      response = await fetch('/api/poetry/random?limit=12')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    poems.value = data.poems || data || []
    
  } catch (error) {
    console.error('获取诗词数据失败:', error)
    ElMessage.error('获取诗词数据失败，请稍后重试')
    // 如果API调用失败，使用示例数据并过滤
    const samplePoems = getSamplePoems()
    const dynasty = categoryToDynasty[selectedCategory.value]
    const category = selectedCategory.value
    
    if (dynasty) {
      poems.value = samplePoems.filter(poem => poem.dynasty === dynasty).slice(0, 12)
    } else if (category === '山水诗' || category === '边塞诗') {
      // 根据主题分类过滤示例数据
      const categoryTags = getCategoryTags(category)
      poems.value = samplePoems.filter(poem => 
        poem.tags && poem.tags.some(tag => categoryTags.includes(tag))
      ).slice(0, 12)
    } else {
      poems.value = samplePoems.sort(() => Math.random() - 0.5).slice(0, 12)
    }
  } finally {
    loading.value = false
  }
}

// 搜索诗词
const searchPoems = async () => {
  if (!searchQuery.value.trim()) {
    await fetchPoems()
    return
  }
  
  try {
    loading.value = true
    const params = new URLSearchParams({
      query: searchQuery.value,
      page: '1',
      limit: '20'
    })
    
    // 根据分类映射到对应的朝代或主题
    const dynasty = categoryToDynasty[selectedCategory.value]
    const category = selectedCategory.value
    
    if (dynasty) {
      params.append('dynasty', dynasty)
    } else if (category === '山水诗' || category === '边塞诗') {
      params.append('category', category)
    }
    
    const response = await fetch(`/api/poetry/search?${params}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    poems.value = data.poems || []
    
  } catch (error) {
    console.error('搜索诗词失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    // 如果搜索失败，从示例数据中搜索
    const samplePoems = getSamplePoems()
    const searchTerm = searchQuery.value.toLowerCase()
    const dynasty = categoryToDynasty[selectedCategory.value]
    const category = selectedCategory.value
    
    poems.value = samplePoems.filter(poem => {
      const matchesSearch = poem.title.toLowerCase().includes(searchTerm) ||
        poem.author.toLowerCase().includes(searchTerm) ||
        poem.content.toLowerCase().includes(searchTerm) ||
        (poem.tags && poem.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      
      // 如果指定了朝代，还需要匹配朝代
      if (dynasty) {
        return matchesSearch && poem.dynasty === dynasty
      }
      
      // 如果指定了主题分类，还需要匹配标签
      if (category === '山水诗' || category === '边塞诗') {
        const categoryTags = getCategoryTags(category)
        return matchesSearch && poem.tags && poem.tags.some(tag => categoryTags.includes(tag))
      }
      
      return matchesSearch
    })
  } finally {
    loading.value = false
  }
}

// 扩展诗词数据，添加图片
const enhancedPoems = computed(() => {
  return poems.value.map((poem, index) => ({
    ...poem,
    image: getImageByPoemId(poem.id || index + 1),
    tags: poem.tags || []
  }))
})

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    fetchSearchSuggestions(searchQuery.value)
    searchPoems()
  } else {
    searchSuggestions.value = []
    fetchPoems()
  }
}

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  searchPoems()
  showSuggestions.value = false
}

const selectPopularSearch = (query) => {
  searchQuery.value = query
  searchPoems()
  showSuggestions.value = false
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const handleCategoryChange = (category) => {
  selectedCategory.value = category
  // 清空搜索框，切换到分类浏览模式
  searchQuery.value = ''
  searchSuggestions.value = []
  fetchPoems()
}

const viewPoemDetail = (poem) => {
  router.push(`/poem/${poem.id}`)
}

// 检查是否已收藏
const isFavorite = (poemId) => {
  try {
    const stored = localStorage.getItem('poetry_favorites')
    if (!stored) return false
    
    const favorites = JSON.parse(stored)
    return favorites.some(fav => fav.id === poemId)
  } catch (error) {
    return false
  }
}

// 切换收藏状态
const toggleFavorite = (poem) => {
  try {
    const stored = localStorage.getItem('poetry_favorites')
    let favorites = stored ? JSON.parse(stored) : []
    
    const existingIndex = favorites.findIndex(fav => fav.id === poem.id)
    
    if (existingIndex !== -1) {
      // 移除收藏
      favorites.splice(existingIndex, 1)
      ElMessage.success('已取消收藏')
    } else {
      // 添加收藏
      const favoritePoem = {
        ...poem,
        favoriteTime: new Date().toISOString(),
        image: getImageByPoemId(poem.id)
      }
      favorites.unshift(favoritePoem)
      ElMessage.success('已添加到收藏')
    }
    
    localStorage.setItem('poetry_favorites', JSON.stringify(favorites))
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 辅助函数：获取分类对应的标签
const getCategoryTags = (category) => {
  const categoryTagMap = {
    '山水诗': ['山水', '自然', '风景', '江河', '山岳'],
    '边塞诗': ['边塞', '战争', '边疆', '军旅', '征戍'],
    '爱情诗': ['爱情', '相思', '恋情', '思念', '情感'],
    '思乡诗': ['思乡', '故乡', '乡愁', '归乡', '怀乡'],
    '咏物诗': ['咏物', '描写', '物品', '自然', '动物'],
    '哲理诗': ['哲理', '人生', '思考', '智慧', '感悟']
  }
  
  return categoryTagMap[category] || []
}

// 示例数据（备用）
const getSamplePoems = () => [
  {
    id: 1,
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    tags: ['思乡', '月亮', '夜晚']
  },
  {
    id: 2,
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    tags: ['春天', '自然', '生活']
  },
  {
    id: 3,
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
    tags: ['登高', '壮丽', '哲理']
  },
  {
    id: 4,
    title: '水调歌头',
    author: '苏轼',
    dynasty: '宋',
    content: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。',
    tags: ['中秋', '思念', '月亮']
  },
  {
    id: 5,
    title: '声声慢',
    author: '李清照',
    dynasty: '宋',
    content: '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。',
    tags: ['忧愁', '秋天', '思念']
  }
]

onMounted(() => {
  fetchPoems()
  fetchPopularSearches()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f9f9f9;
}

.banner-section {
  position: relative;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}

.banner-content {
  position: relative;
  z-index: 2;
  max-width: 600px;
  padding: 0 20px;
}

.banner-text .poem-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.banner-text .poem-author {
  font-size: 18px;
  margin-bottom: 16px;
  opacity: 0.9;
}

.banner-text .poem-content {
  font-size: 16px;
  line-height: 1.6;
  opacity: 0.9;
}

.category-nav {
  background: #f3f4f6;
  padding: 16px 20px;
  overflow-x: auto;
}

.nav-container {
  display: flex;
  gap: 8px;
  min-width: max-content;
}

.category-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.category-btn.active {
  background: #1f2937;
  color: white;
}

.category-btn:hover {
  background: #e5e7eb;
}

.category-btn.active:hover {
  background: #374151;
}

.search-section {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f9fafb;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.popular-searches {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 16px;
}

.popular-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.popular-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.popular-tag:hover {
  background-color: #3b82f6;
  color: white;
}

.poems-section {
  padding: 0 20px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
  text-align: center;
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
  background: white;
}

.poem-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.poem-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.favorite-btn {
  padding: 4px;
  font-size: 16px;
  color: #9ca3af;
  transition: color 0.2s;
}

.favorite-btn:hover {
  color: #ef4444;
}

.text-red-500 {
  color: #ef4444;
}

.poem-meta {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.poem-text {
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
}

.tag {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.no-results {
  padding: 80px 0;
  text-align: center;
}
</style>