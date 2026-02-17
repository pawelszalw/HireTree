import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mockApiPlugin } from './mock-api.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), mockApiPlugin()],
  server: {
    cors: true,
  },
})
