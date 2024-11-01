import {VitePWA} from 'vite-plugin-pwa'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {comlink} from 'vite-plugin-comlink'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
  },
  plugins: [
    react(),
    comlink(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: 'search-interceptor',
        short_name: 'search-interceptor',
        description: 'search-interceptor',
        theme_color: '#ff00ff',
      },

      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
  worker: {
    plugins: () => [comlink()],
  },
})
