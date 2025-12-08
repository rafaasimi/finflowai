import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['vite.svg'],
          manifest: {
            name: 'FinFlow AI',
            short_name: 'FinFlow',
            description:
              'Gerenciador financeiro pessoal com rastreamento de despesas, orçamentos e insights por IA.',
            theme_color: '#0f172a',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            lang: 'pt-BR',
            icons: [
              {
                src: '/vite.svg',
                sizes: 'any',
                type: 'image/svg+xml',
              },
              {
                src: '/vite.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-webfonts',
                  expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'jsdelivr-cdn',
                  expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
                },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
