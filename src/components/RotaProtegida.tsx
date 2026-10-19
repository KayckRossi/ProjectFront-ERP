import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { tokenStorage } from '@/lib/http';

// Sem token, manda para o login lembrando a página pedida
export function RotaProtegida({ children }: { children: ReactNode }) {
  const local = useLocation();
  if (!tokenStorage.obter()) {
    const voltar = encodeURIComponent(local.pathname + local.search);
    return <Navigate to={`/login?voltar=${voltar}`} replace />;
  }
  return <>{children}</>;
}
