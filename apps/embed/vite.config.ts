import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@codecapsule/core': path.resolve(__dirname, '../../packages/core/src'),
      '@codecapsule/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@codecapsule/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3002,
    cors: true
  }
})