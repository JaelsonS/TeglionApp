import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/wordmark.svg', 'og/teglion-og.png'],
      manifest: {
        name: 'Teglion',
        short_name: 'Teglion',
        description: 'Portal contabilístico para escritórios e clientes',
        theme_color: '#0f2942',
        background_color: '#fafaf7',
        display: 'standalone',
        start_url: '/auth',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Entrar — Escritório', url: '/auth/firm/login', description: 'Painel do escritório' },
          { name: 'Entrar — Cliente', url: '/auth/client/login', description: 'Portal do cliente' },
        ],
      },
      workbox: {
        mode: 'production',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
        globIgnores: [
          '**/blog-post-*.js',
          '**/vendor-phone-*.js',
          '**/vendor-query-*.js',
          '**/vendor-motion-*.js',
          '**/Firm*.js',
          '**/Client*.js',
          '**/RecoverPasswordPage-*.js',
          '**/ResetPasswordPage-*.js',
          '**/FirmTasksWorkspacePage-*.js',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 2_500_000,
      },
    }),
  ],
  build: {
    /** esbuild 0.28+ deixa de transpilar destructuring para targets legacy (chrome87). */
    target: 'es2020',
    minify: 'esbuild',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query'
          if (id.includes('node_modules/@radix-ui')) return 'vendor-radix'
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router'
          }
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'
          if (id.includes('/src/shared/contexts/AuthContext')) return 'vendor-auth'
          if (id.includes('node_modules/react-phone-number-input') || id.includes('libphonenumber')) {
            return 'vendor-phone'
          }
          if (id.includes('/src/i18n/resources')) return 'i18n-full'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('/src/content/blog/catalog.json')) return 'blog-catalog'
          if (id.includes('/src/content/blog/posts/')) {
            const slug = id.match(/posts\/([^/]+)\.ts/)?.[1]
            return slug ? `blog-post-${slug}` : 'blog-posts'
          }
        },
      },
    },
  },
 
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  resolve: {
    alias: [
      { find: '@/app', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@/utils', replacement: path.resolve(__dirname, 'src/shared/utils') },
      { find: '@/lib', replacement: path.resolve(__dirname, 'src/shared/lib') },
      { find: '@/types', replacement: path.resolve(__dirname, 'src/shared/types') },
      { find: '@/constants', replacement: path.resolve(__dirname, 'src/shared/constants') },
      { find: '@/config', replacement: path.resolve(__dirname, 'src/shared/config') },
      { find: '@/components', replacement: path.resolve(__dirname, 'src/shared/components') },
      { find: '@/hooks', replacement: path.resolve(__dirname, 'src/shared/hooks') },
      { find: '@/contexts', replacement: path.resolve(__dirname, 'src/shared/contexts') },
      { find: '@/providers', replacement: path.resolve(__dirname, 'src/shared/providers') },
      { find: '@/design-system', replacement: path.resolve(__dirname, 'src/shared/design-system') },
      { find: '@/styles', replacement: path.resolve(__dirname, 'src/shared/styles') },
      { find: '@/services', replacement: path.resolve(__dirname, 'src/infrastructure') },
      { find: '@/api', replacement: path.resolve(__dirname, 'src/infrastructure/api') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
