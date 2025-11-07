import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // This is where Capacitor looks for web assets
    sourcemap: false,
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // allows external access (useful for testing on mobile)
    port: 5173,
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['maplibre-gl', 'firebase/app', 'firebase/firestore', 'firebase/auth'],
  }
})