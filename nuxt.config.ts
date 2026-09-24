// https://nuxt.com/docs/api/configuration/nuxt-config
import { cpSync } from 'node:fs'
import { join } from 'node:path'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/login': { prerender: false }
  },

  compatibilityDate: '2026-06-30',

  nitro: {
    hooks: {
      // Ship SQL migrations inside .output so server/plugins/migrate.ts can apply them on boot
      compiled(nitro) {
        cpSync('server/database/migrations', join(nitro.options.output.serverDir, 'migrations'), { recursive: true })
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
