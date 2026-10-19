// Autenticação: login no backend e token guardado no navegador.
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { api, tokenStorage } from '@/lib/http';
import type { User } from '@/types';

interface RespostaLogin {
  access_token: string;
  user: User;
}

export async function entrar(email: string, password: string, lembrar = true) {
  const resposta = await api<RespostaLogin>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    autenticado: false,
  });
  tokenStorage.salvar(resposta.access_token, lembrar);
  return resposta.user;
}

export async function sair(queryClient: QueryClient) {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* sessão já encerrada */ }
  tokenStorage.limpar();
  queryClient.clear();
}

export function useUsuarioAtual() {
  return useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => api<User>('/api/auth/me'),
    enabled: Boolean(tokenStorage.obter()),
    staleTime: 5 * 60_000,
  });
}

// Só aceita voltar para caminhos internos (evita redirecionar para outro site após o login)
export const destinoSeguro = (destino: string | null) =>
  destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/';
