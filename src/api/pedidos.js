import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';

const CHAVE = ['pedidos'];

// Atualiza periodicamente para mostrar pedidos feitos em outros caixas
export function usePedidos({ atualizarACada = 15_000, ativo = true } = {}) {
  return useQuery({ queryKey: CHAVE, queryFn: () => api('/api/pedidos'), refetchInterval: atualizarACada, enabled: ativo });
}

// Atualização otimista: o card muda de coluna na hora e volta se o servidor recusar
export function useAtualizarStatusPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api(`/api/pedidos/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: CHAVE });
      const anterior = queryClient.getQueryData(CHAVE);
      queryClient.setQueryData(CHAVE, (lista) => lista?.map((p) => (p.id === id ? { ...p, status } : p)));
      return { anterior };
    },
    onError: (_erro, _variaveis, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(CHAVE, contexto.anterior);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  });
}
