import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: ['all', 'medicare_frontend', 'openmedicareai.life', 'localhost', '8.137.177.147'],
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://medicare_backend:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['date-fns'],
  },
})
