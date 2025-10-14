import { defineStore } from 'pinia'

export const usePoetryStore = defineStore('poetry', {
    state: () => ({
        poems: [
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
                tags: ['登高', '哲理', '壮丽']
            },
            {
                id: 4,
                title: '相思',
                author: '王维',
                dynasty: '唐',
                content: '红豆生南国，春来发几枝。愿君多采撷，此物最相思。',
                tags: ['爱情', '相思', '抒情']
            },
            {
                id: 5,
                title: '江雪',
                author: '柳宗元',
                dynasty: '唐',
                content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
                tags: ['冬天', '孤独', '自然']
            }
        ],
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
        addPoem(poem) {
            this.poems.push({
                ...poem,
                id: Math.max(...this.poems.map(p => p.id)) + 1
            })
        }
    }
})