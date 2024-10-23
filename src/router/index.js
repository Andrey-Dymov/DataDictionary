import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import IndexPage from '../pages/IndexPage.vue'
import CollectionDetails from '../pages/CollectionDetails.vue'
import ErrorNotFound from '../pages/ErrorNotFound.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'index',
        component: IndexPage
      },
      {
        path: '/collection/:name?',
        name: 'CollectionDetails',
        component: CollectionDetails,
        props: true
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: ErrorNotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router