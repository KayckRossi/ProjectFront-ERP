import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Domínios de túnel aceitos pelo servidor de dev/preview (ngrok); o resto é bloqueado pelo Vite
const HOSTS_TUNEL = [".ngrok-free.app", ".ngrok.app", ".ngrok.io", ".ngrok-free.dev"];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Com VITE_API_URL=/ o front chama /api na própria origem e o Vite repassa para API_PROXY_TARGET (sem CORS)
  const proxy = env.API_PROXY_TARGET
    ? { "/api": { target: env.API_PROXY_TARGET, changeOrigin: true, secure: false } }
    : undefined;

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: HOSTS_TUNEL,
      proxy,
      hmr: {
        overlay: false,
      },
    },
    preview: {
      host: "::",
      port: 4173,
      allowedHosts: HOSTS_TUNEL,
      proxy,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
