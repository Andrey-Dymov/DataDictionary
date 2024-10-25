import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import IndexPage from '../pages/IndexPage.vue'
import EntityInfo from '../pages/EntityInfo.vue'
import ErrorNotFound from '../pages/ErrorNotFound.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        component: IndexPage
      },
      {
        path: '/collection/:name',
        component: EntityInfo
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),  // Исправлено с process.env на import.meta.env
  routes
})

export default router
