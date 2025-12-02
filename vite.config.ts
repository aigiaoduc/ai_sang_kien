import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  define: {
    // Đảm bảo code cũ dùng process.env không bị lỗi, dù nên chuyển sang import.meta.env
    'process.env': {} 
  }
});