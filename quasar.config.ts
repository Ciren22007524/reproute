// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app';

export default defineConfig(() => {
  return {
    boot: [],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {},

      typescript: {
        strict: true,
        vueShim: true,
      },

      vueRouterMode: 'history',
    },

    devServer: {
      open: false,
    },

    framework: {
      config: {
        dark: 'auto',
      },
      lang: 'zh-TW',
      plugins: ['Notify', 'Dialog', 'LocalStorage'],
    },

    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW',
      extendPWAGenerateSWOptions(cfg) {
        // 這些路徑不能被 Service Worker 的 SPA fallback 攔截（攔截後會回傳快取的 index.html）：
        // - /api/*：交給 Hono
        // - /cdn-cgi/*：Cloudflare 自己的路徑，例如 Access 登入完成後的
        //   /cdn-cgi/access/authorized（寫入登入 cookie）與 /cdn-cgi/access/logout
        cfg.navigateFallbackDenylist = [/^\/api\//, /^\/cdn-cgi\//];
      },
      // 網站在 Cloudflare Access 後面：讀 manifest.json 時要帶登入 cookie，
      // 否則會被 Access 擋下，加到主畫面時拿不到 App 名稱與圖示
      useCredentialsForManifestTag: true,
    },
  };
});
