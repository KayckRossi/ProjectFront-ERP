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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/pdv" element={<PDV />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/vendedores" element={<Vendedores />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/contas-receber" element={<ContasReceber />} />
          <Route path="/contas-pagar" element={<ContasPagar />} />
          <Route path="/recibos" element={<Recibos />} />
          <Route path="/codigos-barras" element={<CodigosBarras />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
