import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, content is served by a separate static server (the content repo,
    // e.g. apache-spark-ct on :5174). Proxy it under /content to avoid CORS.
    proxy: {
      '/content': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/content/, ''),
      },
    },
  },
})
