import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  envDir: path.resolve(__dirname, '../../'),
  base: command === 'build' ? '/owner/' : '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
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
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
}));
