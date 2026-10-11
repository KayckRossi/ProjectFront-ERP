import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';
import { invalidar } from '@/lib/query-client';

export function useFornecedores(opcoes = {}) {
  return useQuery({ queryKey: ['fornecedores'], queryFn: () => api('/api/fornecedores'), ...opcoes });
}

export function useSalvarFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }) =>
      id ? api(`/api/fornecedores/${id}`, { method: 'PUT', body: dados }) : api('/api/fornecedores', { method: 'POST', body: dados }),
    // O nome do fornecedor aparece nas compras
    onSuccess: () => invalidar(queryClient, 'fornecedores', 'compras'),
  });
}

export function useExcluirFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/api/fornecedores/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidar(queryClient, 'fornecedores'),
  });
}
