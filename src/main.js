import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { supabase } from '@/config/supabase'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 初始化Pinia
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 应用挂载前初始化数据
app.mount('#app')