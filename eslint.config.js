import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import pluginQuasar from '@quasar/app-vite/eslint';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs(
  {
    ignores: ['.wrangler/**', 'worker/worker-configuration.d.ts'],
  },

  pluginQuasar.configs.recommended(),
  js.configs.recommended,

  // https://eslint.vuejs.org
  pluginVue.configs['flat/essential'],

  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  // https://github.com/vuejs/eslint-config-typescript
  vueTsConfigs.recommendedTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node, // config files
        process: 'readonly',
      },
    },

    rules: {
      'prefer-promise-reject-errors': 'off',
      'vue/v-slot-style': ['warn', 'shorthand'],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },

  {
    files: ['src-pwa/sw/**/*.ts'],
    languageOptions: {
      globals: { ...globals.serviceworker },
    },
  },

  {
    // Cloudflare Worker（Hono）
    files: ['worker/**/*.ts'],
    languageOptions: {
      globals: { ...globals.serviceworker },
    },
  },

  prettierSkipFormatting,
);
