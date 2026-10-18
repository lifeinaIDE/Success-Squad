import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'client-logger',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/__client_log')) {
            console.log('[CLIENT TELEMETRY]', req.url);
            res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
            res.end('ok');
            return;
          }
          next();
        });
      }
    }
  ],
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
