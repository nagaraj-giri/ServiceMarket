import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // If this plugin isn't available in your environment, you can remove it, but standard Vite React apps use it.

export default defineConfig({
  plugins: [], // react() plugin omitted if dependencies aren't strictly standard, but recommended.
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    host: true
  }
})