import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow any host (needed for the v0 preview proxy / tunneled hosts)
    allowedHosts: true,
  },
})
