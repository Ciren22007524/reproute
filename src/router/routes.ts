import type { RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    back?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/TodayPage.vue'), meta: { title: '今日訓練' } },
      { path: 'plans', component: () => import('@/pages/PlansPage.vue'), meta: { title: '課表' } },
      { path: 'gyms', component: () => import('@/pages/GymsPage.vue'), meta: { title: '廠區' } },
      {
        path: 'gyms/:id',
        component: () => import('@/pages/GymInventoryPage.vue'),
        props: true,
        meta: { title: '器材清點', back: true },
      },
      { path: 'history', component: () => import('@/pages/HistoryPage.vue'), meta: { title: '紀錄' } },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
