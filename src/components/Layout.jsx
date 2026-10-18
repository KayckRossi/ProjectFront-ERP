import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-onyx text-snow overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Mantém sidebar e header visíveis enquanto a página é carregada */}
          <Suspense fallback={
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-graphite border-t-verdigris rounded-full animate-spin"></div>
            </div>
          }>
            {/* Um erro numa tela não derruba o menu; trocar de rota limpa o erro */}
            <ErrorBoundary chave={pathname}>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
