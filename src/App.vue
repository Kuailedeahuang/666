<template>
  <div id="app">
    <!-- 底部导航栏 -->
    <div class="bottom-nav" v-if="showBottomNav">
      <div class="nav-container">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <i class="fas fa-home"></i>
          <span>首页</span>
        </router-link>
        <router-link to="/favorites" class="nav-item" :class="{ active: $route.path === '/favorites' }">
          <i class="fas fa-heart"></i>
          <span>收藏</span>
        </router-link>
        <router-link to="/creation" class="nav-item" :class="{ active: $route.path === '/creation' }">
          <i class="fas fa-pen-fancy"></i>
          <span>创作</span>
        </router-link>
        <router-link to="/profile" class="nav-item" :class="{ active: $route.path === '/profile' }">
          <i class="fas fa-user"></i>
          <span>我的</span>
        </router-link>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showBottomNav = computed(() => {
  return true // 始终显示底部导航
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #f9f9f9;
}

.main-content {
  min-height: calc(100vh - 70px);
  padding-bottom: 70px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  z-index: 1000;
}

.nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 70px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #6b7280;
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-item i {
  font-size: 20px;
  margin-bottom: 4px;
}

.nav-item.active {
  color: #f59e0b;
}

.nav-item:hover {
  background-color: #f3f4f6;
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Noto+Serif+SC:wght@400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

body {
  font-family: 'Noto Serif SC', serif;
  margin: 0;
  padding: 0;
}

.font-logo {
  font-family: 'Pacifico', cursive;
}

.card-shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
</style>