import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';
import { invalidar } from '@/lib/query-client';

export function useClientes(opcoes = {}) {
  return useQuery({ queryKey: ['clientes'], queryFn: () => api('/api/clientes'), ...opcoes });
}

export function useSalvarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }) =>
      id ? api(`/api/clientes/${id}`, { method: 'PUT', body: dados }) : api('/api/clientes', { method: 'POST', body: dados }),
    onSuccess: () => invalidar(queryClient, 'clientes', 'relatorios'),
  });
}

export function useExcluirCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/api/clientes/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidar(queryClient, 'clientes', 'relatorios'),
  });
}
