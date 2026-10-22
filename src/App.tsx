import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Vendedores from "./pages/Vendedores";
import Estoque from "./pages/Estoque";
import ContasReceber from "./pages/ContasReceber";
import ContasPagar from "./pages/ContasPagar";
import Recibos from "./pages/Recibos";
import CodigosBarras from "./pages/CodigosBarras";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";
import { ApiError } from "./lib/http";
import { RotaProtegida } from "./components/RotaProtegida";

const queryClient = new QueryClient({
  defaultOptions: {
    // 401 já leva ao login; repetir só faz sentido para falhas de rede/servidor
    queries: { retry: (falhas, erro) => falhas < 2 && !(erro instanceof ApiError && erro.status < 500 && erro.status > 0), refetchOnWindowFocus: false },
  },
});

const ROTAS = [
  { path: "/", element: <Dashboard /> },
  { path: "/pdv", element: <PDV /> },
  { path: "/produtos", element: <Produtos /> },
  { path: "/clientes", element: <Clientes /> },
  { path: "/fornecedores", element: <Fornecedores /> },
  { path: "/vendedores", element: <Vendedores /> },
  { path: "/estoque", element: <Estoque /> },
  { path: "/contas-receber", element: <ContasReceber /> },
  { path: "/contas-pagar", element: <ContasPagar /> },
  { path: "/recibos", element: <Recibos /> },
  { path: "/codigos-barras", element: <CodigosBarras /> },
  { path: "/relatorios", element: <Relatorios /> },
  { path: "/usuarios", element: <Usuarios /> },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {ROTAS.map(({ path, element }) => (
            <Route key={path} path={path} element={<RotaProtegida>{element}</RotaProtegida>} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
