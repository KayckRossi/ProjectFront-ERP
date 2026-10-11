import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';

export const MODELOS_IMPRESSAO = ['Térmica 80mm', 'Térmica 58mm', 'A4'];

export function useConfiguracoes() {
  return useQuery({ queryKey: ['configuracoes'], queryFn: () => api('/api/configuracoes'), staleTime: 5 * 60_000 });
}

export function useSalvarConfiguracoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (configuracoes) => api('/api/configuracoes', { method: 'PUT', body: configuracoes }),
    onSuccess: (salvas) => queryClient.setQueryData(['configuracoes'], salvas),
  });
}

export function useEncerrarOutrasSessoes() {
  return useMutation({ mutationFn: () => api('/api/auth/sessions/revoke-others', { method: 'POST' }) });
}
