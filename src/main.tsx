import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { aplicarApiDaUrl, definirAoExpirarSessao } from "./lib/http";
import "./index.css";

// ?api=https://... na URL troca o backend sem precisar de novo build
aplicarApiDaUrl();

// Token recusado pelo backend (401): volta para o login lembrando a página atual
definirAoExpirarSessao(() => {
  if (window.location.pathname === "/login") return;
  const voltar = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`/login?voltar=${voltar}`);
});

createRoot(document.getElementById("root")!).render(<App />);
