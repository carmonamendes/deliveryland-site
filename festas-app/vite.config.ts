import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O app é servido em https://deliveryland.com.br/festas/
// O build sai em ../festas (raiz do site GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: '/festas/',
  build: {
    outDir: '../festas',
    emptyOutDir: true,
    sourcemap: false,
  },
});
