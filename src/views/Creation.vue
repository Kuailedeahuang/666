<template>
  <div class="creation-container">
    <!-- 导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <span class="font-logo text-xl">诗韵赏析</span>
          <h1 class="page-title">诗词创作</h1>
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

    <!-- 创作表单 -->
    <main class="creation-main">
      <el-card class="creation-form" shadow="hover">
        <template #header>
          <h3 class="form-title">创作新诗词</h3>
        </template>
        
        <el-form :model="poemForm" :rules="formRules" ref="formRef" label-width="80px">
          <el-form-item label="诗词标题" prop="title">
            <el-input 
              v-model="poemForm.title" 
              placeholder="请输入诗词标题"
              size="large" />
          </el-form-item>
          
          <el-form-item label="作者" prop="author">
            <el-input 
              v-model="poemForm.author" 
              placeholder="请输入作者名"
              size="large" />
          </el-form-item>
          
          <el-form-item label="朝代" prop="dynasty">
            <el-select v-model="poemForm.dynasty" placeholder="选择朝代" size="large" style="width: 100%">
              <el-option label="唐代" value="唐" />
              <el-option label="宋代" value="宋" />
              <el-option label="元代" value="元" />
              <el-option label="明代" value="明" />
              <el-option label="清代" value="清" />
              <el-option label="现代" value="现代" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="诗词内容" prop="content">
            <el-input
              v-model="poemForm.content"
              type="textarea"
              :rows="6"
              placeholder="请输入诗词内容"
              maxlength="500"
              show-word-limit />
          </el-form-item>
          
          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" size="large" @click="submitPoem">
                保存作品
              </el-button>
              <el-button size="large" @click="resetForm">
                重置
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- AI创作助手 -->
      <el-card class="ai-assistant" shadow="hover">
        <template #header>
          <h3 class="assistant-title">AI创作助手</h3>
        </template>
        
        <div class="assistant-content">
          <p class="assistant-tip">需要创作灵感？让AI助手帮您！</p>
          <el-button type="success" @click="generatePoem">
            <i class="fas fa-magic"></i>
            智能生成
          </el-button>
        </div>
      </el-card>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const formRef = ref()
const poemForm = reactive({
  title: '',
  author: '',
  dynasty: '',
  content: ''
})

const formRules = {
  title: [
    { required: true, message: '请输入诗词标题', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者名', trigger: 'blur' }
  ],
  dynasty: [
    { required: true, message: '请选择朝代', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入诗词内容', trigger: 'blur' }
  ]
}

const submitPoem = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 模拟保存作品
    ElMessage.success('作品保存成功！')
    resetForm()
  } catch (error) {
    ElMessage.error('请完善表单信息')
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const generatePoem = () => {
  // 模拟AI生成诗词
  poemForm.title = '春夜喜雨'
  poemForm.author = '杜甫'
  poemForm.dynasty = '唐'
  poemForm.content = '好雨知时节，当春乃发生。随风潜入夜，润物细无声。野径云俱黑，江船火独明。晓看红湿处，花重锦官城。'
  
  ElMessage.info('AI已为您生成一首诗词')
}
</script>

<style scoped>
.creation-container {
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

.creation-main {
  padding: 24px 20px;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.creation-form, .ai-assistant {
  border-radius: 12px;
}

.form-title, .assistant-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.assistant-content {
  text-align: center;
  padding: 20px 0;
}

.assistant-tip {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 16px;
}
</style>