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
      <el-input
        v-model="searchQuery"
        placeholder="搜索诗词、作者或关键词..."
        size="large"
        class="search-input"
        @input="handleSearch"
        clearable>
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
      </el-input>
    </div>

    <!-- 热门诗词列表 -->
    <main class="poems-section">
      <h2 class="section-title">热门诗词</h2>
      
      <div class="poems-grid">
        <el-card 
          v-for="poem in filteredPoems" 
          :key="poem.id" 
          class="poem-card"
          shadow="hover"
          @click="viewPoemDetail(poem)">
          <div class="card-image">
            <img :src="poem.image" :alt="poem.title" class="poem-image" />
          </div>
          <div class="card-content">
            <h3 class="poem-title">{{ poem.title }}</h3>
            <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
            <p class="poem-text">{{ poem.content }}</p>
            <div class="poem-tags">
              <span v-for="tag in poem.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 无结果提示 -->
      <div v-if="filteredPoems.length === 0" class="no-results">
        <el-empty description="未找到相关诗词" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePoetryStore } from '../stores/poetry'

const router = useRouter()
const poetryStore = usePoetryStore()

const searchQuery = ref('')
const selectedCategory = ref('全部')

// 扩展诗词数据，添加图片
const enhancedPoems = computed(() => {
  const imageUrls = [
    'https://ai-public.mastergo.com/ai/img_res/4575dd21f53cf2bdae389e523f74ef43.jpg',
    'https://ai-public.mastergo.com/ai/img_res/b172092099a902fd1223ef757c2bac1b.jpg',
    'https://ai-public.mastergo.com/ai/img_res/d84620fed18dfcdfb6de84ba5647efc5.jpg',
    'https://ai-public.mastergo.com/ai/img_res/787976d0905dc82babc5202a4b9cf69e.jpg',
    'https://ai-public.mastergo.com/ai/img_res/722337332f17e449e3e27625e0f07e81.jpg'
  ]
  
  return poetryStore.poems.map((poem, index) => ({
    ...poem,
    image: imageUrls[index % imageUrls.length]
  }))
})

const categories = computed(() => ['全部', '唐诗', '宋词', '元曲', '现代诗', '山水诗', '边塞诗'])

const filteredPoems = computed(() => {
  let filtered = enhancedPoems.value
  
  if (selectedCategory.value !== '全部') {
    filtered = filtered.filter(poem => {
      if (selectedCategory.value === '唐诗') return poem.dynasty === '唐'
      if (selectedCategory.value === '宋词') return poem.dynasty === '宋'
      if (selectedCategory.value === '元曲') return poem.dynasty === '元'
      return poem.tags.includes(selectedCategory.value)
    })
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(poem => 
      poem.title.toLowerCase().includes(query) ||
      poem.author.toLowerCase().includes(query) ||
      poem.content.toLowerCase().includes(query) ||
      poem.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  return filtered
})

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const handleCategoryChange = (category) => {
  selectedCategory.value = category
}

const viewPoemDetail = (poem) => {
  poetryStore.setCurrentPoem(poem)
  router.push(`/poem/${poem.id}`)
}

onMounted(() => {
  // 初始化数据
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
}

.search-input {
  width: 100%;
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