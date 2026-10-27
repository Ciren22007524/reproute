/**
 * 路由表：網址對應哪個頁面。
 * 新增主要頁面時，也要到 components/layout/AppBottomNav.vue 加分頁。
 */
import type { RouteRecordRaw } from 'vue-router';

// 擴充路由的 meta 欄位型別，AppHeader 會讀這兩個值
declare module 'vue-router' {
  interface RouteMeta {
    /** 標題列顯示的文字 */
    title?: string;
    /** 是否在標題列顯示返回鈕（子頁面用） */
    back?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  {
    // 一般頁面都包在 MainLayout 裡（有標題列與底部分頁）
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/TodayPage.vue'), meta: { title: '今日訓練' } },
      { path: 'plans', component: () => import('@/pages/PlansPage.vue'), meta: { title: '課表' } },
      { path: 'gyms', component: () => import('@/pages/GymsPage.vue'), meta: { title: '廠區' } },
      {
        path: 'gyms/:id',
        component: () => import('@/pages/GymInventoryPage.vue'),
        // 把網址的 :id 當成頁面的 props.id 傳進去
        props: true,
        meta: { title: '器材清點', back: true },
      },
      {
        path: 'history',
        component: () => import('@/pages/HistoryPage.vue'),
        meta: { title: '紀錄' },
      },
    ],
  },

  // 其他網址一律顯示 404，必須放在最後
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
