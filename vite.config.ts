import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [mkcert()],
  // HMR causes cursors to stack
  server: {
    hmr: false,
  },
});
