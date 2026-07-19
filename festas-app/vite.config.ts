import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O app é servido na RAIZ do domínio próprio: https://atelieabelhinha.com.br
// O build sai em ../festas (artefato versionado; publique o conteúdo no
// docroot da VPS que atende atelieabelhinha.com.br).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../festas',
    emptyOutDir: true,
    sourcemap: false,
  },
});
