import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET (sem prefixo VITE_, não vai para o navegador): encaminha /api para o backend
  // no servidor de desenvolvimento e no preview, evitando CORS. Use junto com VITE_API_URL=/
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), '');
  const proxy = API_PROXY_TARGET ? { '/api': { target: API_PROXY_TARGET, changeOrigin: true } } : undefined;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { proxy },
    preview: { proxy },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  };
});
