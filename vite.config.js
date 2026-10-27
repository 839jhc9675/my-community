import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 주소(https://<계정>.github.io/my-community/)에 맞춘 기본 경로
  base: '/my-community/',
})
