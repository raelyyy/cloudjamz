import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Exclude API directory from Vite processing (for Vercel functions)
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['.']
    }
  },
  // Ignore API directory in build
  build: {
    rollupOptions: {
      external: (id) => id.startsWith('/api/') || id.includes('api/'),
    },
  },
})
