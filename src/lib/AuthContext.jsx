import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authApi } from '@/api/auth';
import { EVENTO_SESSAO_EXPIRADA } from '@/api/http';
import { queryClientInstance } from '@/lib/query-client';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const usuarioRef = useRef(null);
  usuarioRef.current = user;

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      setUser(await authApi.usuarioAtual());
    } catch (error) {
      // Servidor fora do ar ou erro inesperado: mantém o usuário deslogado e informa o motivo
      console.error('Falha ao verificar a sessão:', error);
      setUser(null);
      setAuthError(error.message);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  // O backend recusou o token durante o uso: volta ao login (a rota protegida guarda a página atual)
  useEffect(() => {
    const aoExpirar = () => {
      if (usuarioRef.current) {
        usuarioRef.current = null;
        toast({ title: 'Sua sessão expirou', description: 'Entre novamente para continuar.' });
      }
      setUser(null);
      queryClientInstance.clear();
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const logout = (shouldRedirect = true) => {
    authApi.logout();
    queryClientInstance.clear();
    setUser(null);
    if (shouldRedirect) window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      authError,
      logout,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
