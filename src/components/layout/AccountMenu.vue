<!-- 本機使用狀態，不在啟動時查詢登入或導向外部驗證。 -->
<template>
  <q-btn flat round icon="devices" aria-label="本機使用狀態" class="tap-target">
    <q-menu
      ><q-list style="min-width: 240px"
        ><q-item
          ><q-item-section>
            <q-item-label>本機模式・不需登入</q-item-label>
            <q-item-label caption>資料保存在這台裝置，雲端服務需另行連接。</q-item-label>
          </q-item-section></q-item
        ></q-list
      ></q-menu
    >
  </q-btn>
</template>
