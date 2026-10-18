import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET (sem prefixo VITE_, não vai para o navegador): encaminha /api para o backend
  // no servidor de desenvolvimento e no preview, evitando CORS. Use junto com VITE_API_URL=/
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), '');
  const proxy = API_PROXY_TARGET ? { '/api': { target: API_PROXY_TARGET, changeOrigin: true } } : undefined;

  // Cabeçalhos de segurança da produção (vercel.json), aplicados também no `npm run preview`
  const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf-8'));
  const cabecalhos = Object.fromEntries(vercel.headers[0].headers.map(({ key, value }) => [key, value]));

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { proxy },
    preview: { proxy, headers: cabecalhos },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  };
});
