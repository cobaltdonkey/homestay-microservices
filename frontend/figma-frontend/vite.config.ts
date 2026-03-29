import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      // Forward all API calls to Kong gateway (port 8000)
      '/users': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/listings': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/search': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/availability': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/bookings': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/gateway': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/stays': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/notifications': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})

