import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-helmet-async',
      'lucide-react',
      'html2canvas',
      'jspdf',
      'jszip',
      'file-saver',
      '@supabase/supabase-js'
    ],
  },
  server: {
    port: 5174,
    host: true,
  },
})
