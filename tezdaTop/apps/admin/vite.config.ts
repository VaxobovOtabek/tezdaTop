import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { localCatalog } from './vite-local-catalog';

const apiTarget = 'http://127.0.0.1:4000';

export default defineConfig(({ command }) => ({
  envDir: path.resolve(__dirname, '../../'),
  base: command === 'build' ? '/admin/' : '/',
  plugins: [react(), localCatalog(apiTarget)],
  build: {
    chunkSizeWarningLimit: 800,
    commonjsOptions: {
      esmExternals: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-leaflet': ['leaflet'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@yaqintop/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@yaqintop/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
      '@yaqintop/config': path.resolve(__dirname, '../../packages/config/src/index.ts')
    }
  },
  server: {
    host: true,
    port: 3002,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  }
}));
