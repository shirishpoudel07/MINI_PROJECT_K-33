import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress noisy unhandled ECONNREFUSED when backend is offline
          });
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress noisy unhandled ws proxy ECONNREFUSED when backend is offline
          });
        },
      },
    },
  },
})
