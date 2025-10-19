import { defineStore } from 'pinia'
import { supabaseAPI } from '@/config/supabase'
import { http } from '@/utils/http.js'

export const usePoetryStore = defineStore('poetry', {
    state: () => ({
        poems: [],
        categories: ['全部', '唐', '宋', '元', '明', '清'],
        searchQuery: '',
        selectedCategory: '全部',
        currentPoem: null
    }),
    getters: {
        filteredPoems: (state) => {
            let filtered = state.poems
            
            if (state.selectedCategory !== '全部') {
                filtered = filtered.filter(poem => poem.dynasty === state.selectedCategory)
            }
            
            if (state.searchQuery) {
                const query = state.searchQuery.toLowerCase()
                filtered = filtered.filter(poem => 
                    poem.title.toLowerCase().includes(query) ||
                    poem.author.toLowerCase().includes(query) ||
                    poem.content.toLowerCase().includes(query) ||
                    poem.tags.some(tag => tag.toLowerCase().includes(query))
                )
            }
            
            return filtered
        }
    },
    actions: {
        setSearchQuery(query) {
            this.searchQuery = query
        },
        setCategory(category) {
            this.selectedCategory = category
        },
        setCurrentPoem(poem) {
            this.currentPoem = poem
        },
        // 从后端API加载随机诗词数据
        async loadPoems() {
            try {
                const data = await http.get('/poetry/random?limit=20')
                this.poems = data || []
            } catch (error) {
                console.error('加载诗词数据失败:', error)
                // 如果API调用失败，使用本地示例数据并随机排序
                this.poems = [
                    {
                        id: 1,
                        title: '静夜思',
                        author: '李白',
                        dynasty: '唐',
                        content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
                        tags: ['思乡', '明月', '抒情']
                    },
                    {
                        id: 2,
                        title: '春晓',
                        author: '孟浩然',
                        dynasty: '唐',
                        content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
                        tags: ['春天', '自然', '抒情']
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
                ].sort(() => Math.random() - 0.5)
            }
        },

        // 添加新诗词到Supabase
        async addPoem(poem) {
            try {
                const newPoem = {
                    title: poem.title,
                    author: poem.author,
                    dynasty: poem.dynasty,
                    content: poem.content,
                    tags: poem.tags,
                    created_at: new Date().toISOString()
                }
                
                const result = await supabaseAPI.insert('poems', newPoem)
                if (result && result.length > 0) {
                    this.poems.push(result[0])
                    return result[0]
                }
            } catch (error) {
                console.error('添加诗词失败:', error)
                throw error
            }
        },

        // 更新诗词
        async updatePoem(poemId, updates) {
            try {
                const result = await supabaseAPI.update('poems', updates, { id: poemId })
                if (result && result.length > 0) {
                    const index = this.poems.findIndex(p => p.id === poemId)
                    if (index !== -1) {
                        this.poems[index] = { ...this.poems[index], ...updates }
                    }
                    return result[0]
                }
            } catch (error) {
                console.error('更新诗词失败:', error)
                throw error
            }
        },

        // 删除诗词
        async deletePoem(poemId) {
            try {
                await supabaseAPI.delete('poems', { id: poemId })
                this.poems = this.poems.filter(p => p.id !== poemId)
            } catch (error) {
                console.error('删除诗词失败:', error)
                throw error
            }
        },

        // 搜索诗词（支持Supabase全文搜索）
        async searchPoems(query) {
            try {
                if (!query.trim()) {
                    await this.loadPoems()
                    return
                }
                
                const { data, error } = await supabaseAPI.select(
                    'poems',
                    '*',
                    {
                        textSearch: `title,author,content,tags`,
                        searchQuery: query
                    }
                )
                
                if (!error && data) {
                    this.poems = data
                }
            } catch (error) {
                console.error('搜索诗词失败:', error)
                // 如果Supabase搜索失败，使用本地过滤
                this.setSearchQuery(query)
            }
        }
    }
})