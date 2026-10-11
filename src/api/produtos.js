import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';
import { invalidar } from '@/lib/query-client';

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => api('/api/categorias'),
    staleTime: 5 * 60_000,
  });
}

export function useProdutos(opcoes = {}) {
  return useQuery({ queryKey: ['produtos'], queryFn: () => api('/api/produtos'), ...opcoes });
}

export function useSalvarProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }) =>
      id ? api(`/api/produtos/${id}`, { method: 'PUT', body: dados }) : api('/api/produtos', { method: 'POST', body: dados }),
    onSuccess: () => invalidar(queryClient, 'produtos', 'estoque', 'dashboard', 'relatorios'),
  });
}

export function useExcluirProduto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/api/produtos/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidar(queryClient, 'produtos', 'estoque', 'dashboard'),
  });
}
