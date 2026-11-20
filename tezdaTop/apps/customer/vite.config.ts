import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { localBarbershops } from './vite-local-barbershops';

const apiTarget = 'http://127.0.0.1:4000';

export default defineConfig(({ command }) => ({
  envDir: path.resolve(__dirname, '../../'),
  base: command === 'build' ? '/customer/' : '/',
  plugins: [
    react(),
    localBarbershops(apiTarget),
    {
      name: 'customer-assets-dev-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = (req.url || '').split('?')[0].replace(/\/+$/, '');
          if (rawUrl === '/api/local/uzum-points') {
            import('fs').then((fs) => {
              const candidatePaths = [
                path.resolve(__dirname, '../../uzummarket/uzum_delivery_points_yaqintop.json'),
                path.resolve(__dirname, '../../../uzummarket/uzum_delivery_points_yaqintop.json'),
                path.resolve(__dirname, 'uzum_delivery_points_yaqintop.json')
              ];
              const targetPath = candidatePaths.find(p => fs.existsSync(p));
              if (targetPath) {
                res.setHeader('Content-Type', 'application/json');
                fs.createReadStream(targetPath).pipe(res);
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end('[]');
              }
            });
            return;
          }
          if (rawUrl === '/api/local/game-clubs') {
            import('fs').then((fs) => {
              const candidatePaths = [
                path.resolve(__dirname, '../../gameClub/game_clubs_yaqintop.json'),
                path.resolve(__dirname, '../../../gameClub/game_clubs_yaqintop.json'),
                path.resolve(__dirname, 'game_clubs_yaqintop.json')
              ];
              const targetPath = candidatePaths.find(p => fs.existsSync(p));
              if (targetPath) {
                res.setHeader('Content-Type', 'application/json');
                fs.createReadStream(targetPath).pipe(res);
              } else {
                res.setHeader('Content-Type', 'application/json');
                res.end('[]');
              }
            });
            return;
          }
          if (rawUrl === '/customer') {
            res.writeHead(302, { Location: '/' });
            res.end();
            return;
          }
          if (req.url && req.url.startsWith('/customer/')) {
            const cleanUrl = req.url.split('?')[0];
            if (
              cleanUrl.endsWith('.png') ||
              cleanUrl.endsWith('.svg') ||
              cleanUrl.endsWith('.ico') ||
              cleanUrl.endsWith('.json') ||
              cleanUrl.endsWith('.js') ||
              cleanUrl.endsWith('.css') ||
              cleanUrl.includes('/icons/')
            ) {
              req.url = req.url.replace('/customer/', '/');
            }
          }
          next();
        });
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('leaflet')) return 'vendor-leaflet';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('decimal.js') || id.includes('zod')) return 'vendor-core';
            return 'vendor-libs';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@yaqintop/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@yaqintop/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@yaqintop/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
      '@yaqintop/landing-app': path.resolve(__dirname, '../landing/src/App.tsx')
    }
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  }
}));
