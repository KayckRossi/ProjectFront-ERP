import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import PaginaNaoEncontrada from '@/pages/PaginaNaoEncontrada';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import RotaComPermissao from '@/components/RotaComPermissao';
import { backofficeConfigurado, linkBackoffice } from '@/lib/links';

// Páginas carregadas sob demanda para reduzir o bundle inicial
const Login = lazy(() => import('@/pages/Login'));
const Cadastro = lazy(() => import('@/pages/Cadastro'));
const EsqueciSenha = lazy(() => import('@/pages/EsqueciSenha'));
const RedefinirSenha = lazy(() => import('@/pages/RedefinirSenha'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const PDV = lazy(() => import('@/pages/PDV'));
const Vendas = lazy(() => import('@/pages/Vendas'));
const Produtos = lazy(() => import('@/pages/Produtos'));
const Estoque = lazy(() => import('@/pages/Estoque'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Financeiro = lazy(() => import('@/pages/Financeiro'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));

// Rotas internas e a permissão exigida (src/lib/permissoes.js).
// Caixa, compras, fornecedores, categorias, usuários e auditoria ficam no Nexora Backoffice (outro repositório).
const ROTAS_INTERNAS = [
  { caminho: '/pdv', permissao: 'pdv.operar', Pagina: PDV },
  { caminho: '/pos', permissao: 'pdv.operar', Pagina: PDV },
  { caminho: '/vendas', permissao: 'vendas.ver', Pagina: Vendas },
  { caminho: '/produtos', permissao: 'produtos.gerenciar', Pagina: Produtos },
  { caminho: '/estoque', permissao: 'estoque.gerenciar', Pagina: Estoque },
  { caminho: '/clientes', permissao: 'clientes.gerenciar', Pagina: Clientes },
  { caminho: '/financeiro', permissao: 'financeiro.ver', Pagina: Financeiro },
  { caminho: '/relatorios', permissao: 'relatorios.ver', Pagina: Relatorios },
  { caminho: '/configuracoes', permissao: 'configuracoes.gerenciar', Pagina: Configuracoes },
];

// O operador de caixa não vê o dashboard: começa direto no PDV
function Inicio() {
  const { pode } = useAuth();
  return pode('dashboard.ver') ? <Dashboard /> : <Navigate to="/pdv" replace />;
}

// Endereços antigos (/backoffice/compras...) vão para a mesma tela no Nexora Backoffice, quando configurado
function RedirecionarBackoffice() {
  const { '*': caminho } = useParams();
  const { search } = useLocation();
  useEffect(() => {
    if (backofficeConfigurado) window.location.replace(linkBackoffice(`/${caminho}${search}`));
  }, [caminho, search]);
  return backofficeConfigurado ? null : <PaginaNaoEncontrada />;
}

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
            <Route path="/" element={<Inicio />} />
            {ROTAS_INTERNAS.map(({ caminho, permissao, Pagina }) => (
              <Route key={caminho} path={caminho} element={<RotaComPermissao permissao={permissao}><Pagina /></RotaComPermissao>} />
            ))}
          </Route>
        </Route>
        <Route path="/backoffice/*" element={<RedirecionarBackoffice />} />
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
