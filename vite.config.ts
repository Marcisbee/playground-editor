import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    process: {
      env: {
        NODE_DEBUG: false,
      },
    },
    global: {},
  },
  plugins: [reactRefresh()]
})
