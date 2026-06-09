import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Für GitHub Pages wird DEPLOY_BASE=/Workstation/ gesetzt (siehe .github/workflows/deploy.yml)
  base: process.env.DEPLOY_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
