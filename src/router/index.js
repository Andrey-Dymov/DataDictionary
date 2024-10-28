import { createRouter, createWebHistory } from 'vue-router'
import EntityInfo from '../pages/EntityInfo.vue'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/entity'
      },
      {
        path: 'entity/:name?',
        name: 'entity',
        component: EntityInfo
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes
})

export default router
