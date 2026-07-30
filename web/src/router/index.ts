import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../views/home.vue')
  },
  {
    path: '/gallery',
    component: () => import('../views/gallery.vue')
  },
  {
    path: '/rules',
    component: () => import('../views/rules/index.vue')
  },
  {
    path: '/rules/edit',
    component: () => import('../views/rules/edit.vue')
  },
  {
    path: '/rules/discovery',
    component: () => import('../views/rules/discovery.vue')
  },
  {
    path: '/rules/detail',
    component: () => import('../views/rules/detail.vue')
  },
  {
    path: '/search',
    component: () => import('../views/search.vue')
  },
  {
    path: '/video',
    component: () => import('../views/module-view.vue'),
    props: { type: '视频' }
  },
  {
    path: '/picture',
    component: () => import('../views/module-view.vue'),
    props: { type: '图片' }
  },
  {
    path: '/novel',
    component: () => import('../views/module-view.vue'),
    props: { type: '小说' }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
