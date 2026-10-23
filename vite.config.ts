import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { twofoldApi } from './server/vite-plugin'

export default defineConfig({
  // The API is mounted as middleware on this same server, so dev AND preview
  // are one process on one port. See server/vite-plugin.ts.
  plugins: [react(), twofoldApi()],
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  preview: {
    port: 4173,
  },
})
