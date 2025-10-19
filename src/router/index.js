import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PoemDetail from '../views/PoemDetail.vue'
import Favorites from '../views/Favorites.vue'
import Creation from '../views/Creation.vue'
import Profile from '../views/Profile.vue'
import Settings from '../views/Settings.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/poem/:id',
        name: 'PoemDetail',
        component: PoemDetail
    },
    {
        path: '/favorites',
        name: 'Favorites',
        component: Favorites
    },
    {
        path: '/creation',
        name: 'Creation',
        component: Creation
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile
    },
    {
        path: '/settings/:section?',
        name: 'Settings',
        component: Settings
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router