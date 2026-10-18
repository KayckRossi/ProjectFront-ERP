import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';
import { invalidar } from '@/lib/query-client';

export function useEstoque(opcoes = {}) {
  return useQuery({ queryKey: ['estoque'], queryFn: () => api('/api/estoque'), ...opcoes });
}

// { produtoId, tipo: 'entrada' | 'saida', quantidade }
export function useMovimentarEstoque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movimentacao) => api('/api/estoque/movimentacoes', { method: 'POST', body: movimentacao }),
    onSuccess: () => invalidar(queryClient, 'estoque', 'produtos', 'dashboard'),
  });
}
