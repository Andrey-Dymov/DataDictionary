import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('../pages/IndexPage.vue') 
      },
      {
        path: 'collection/:name',
        component: () => import('../pages/CollectionDetails.vue'),
        props: true
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue')
  }
]

export default routes