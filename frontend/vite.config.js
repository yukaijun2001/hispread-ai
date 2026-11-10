import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  server: {port: 5173, strictPort: true, proxy: {'/api': {target: process.env.API_ORIGIN || 'http://127.0.0.1:8080', changeOrigin: false}}},
  build: {target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 750, reportCompressedSize: false}
});
