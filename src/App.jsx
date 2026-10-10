import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PaginaNaoEncontrada from '@/pages/PaginaNaoEncontrada';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ErpDataProvider } from '@/lib/ErpDataContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

// Páginas carregadas sob demanda para reduzir o bundle inicial
const Login = lazy(() => import('@/pages/Login'));
const Cadastro = lazy(() => import('@/pages/Cadastro'));
const EsqueciSenha = lazy(() => import('@/pages/EsqueciSenha'));
const RedefinirSenha = lazy(() => import('@/pages/RedefinirSenha'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const PDV = lazy(() => import('@/pages/PDV'));
const Produtos = lazy(() => import('@/pages/Produtos'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Financeiro = lazy(() => import('@/pages/Financeiro'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));

const Carregando = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-onyx">
    <div className="w-8 h-8 border-4 border-graphite border-t-verdigris rounded-full animate-spin"></div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<Carregando />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/register" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/forgot-password" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/reset-password" element={<RedefinirSenha />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/pos" element={<PDV />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErpDataProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <AppRoutes />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </ErpDataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
