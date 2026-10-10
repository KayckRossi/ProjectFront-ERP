import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-onyx">
    <div className="w-8 h-8 border-4 border-graphite border-t-verdigris rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return fallback;
  }

  if (!isAuthenticated) {
    // Guarda a rota original para voltar a ela depois do login
    const destino = location.pathname + location.search;
    const returnTo = destino !== '/' ? `?returnTo=${encodeURIComponent(destino)}` : '';
    return <Navigate to={`/login${returnTo}`} replace />;
  }

  return <Outlet />;
}
