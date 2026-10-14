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
        // /api/* 交給 Hono，不要被 Service Worker 的 SPA fallback 攔截
        cfg.navigateFallbackDenylist = [/^\/api\//];
      },
    },
  };
});
