import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';
import { invalidar } from '@/lib/query-client';

// filtros: { dataInicio, dataFim, status, formaPagamento, clienteId, busca }
export function useVendas(filtros, opcoes = {}) {
  return useQuery({
    queryKey: ['vendas', 'lista', filtros],
    queryFn: () => api(comParametros('/api/vendas', filtros)),
    placeholderData: keepPreviousData,
    ...opcoes,
  });
}

export function useVendasRecentes(limite = 6) {
  return useQuery({
    queryKey: ['vendas', 'recentes', limite],
    queryFn: () => api(comParametros('/api/vendas/recentes', { limite })),
  });
}

export function useVenda(id) {
  return useQuery({
    queryKey: ['vendas', 'detalhe', id],
    queryFn: () => api(`/api/vendas/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
}

// Uma venda afeta estoque, pedidos, financeiro, clientes, dashboard e relatórios: invalida tudo
export function useRegistrarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (venda) => api('/api/vendas', { method: 'POST', body: venda }),
    onSuccess: () => invalidar(queryClient),
  });
}

export function useCancelarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }) => api(`/api/vendas/${encodeURIComponent(id)}/cancelar`, { method: 'POST', body: { motivo } }),
    onSuccess: () => invalidar(queryClient),
  });
}
