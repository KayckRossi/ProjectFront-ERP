import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';
import { invalidar } from '@/lib/query-client';

// filtros: { dataInicio, dataFim, status, fornecedorId, busca }
export function useCompras(filtros, opcoes = {}) {
  return useQuery({
    queryKey: ['compras', 'lista', filtros],
    queryFn: () => api(comParametros('/api/compras', filtros)),
    placeholderData: keepPreviousData,
    ...opcoes,
  });
}

export function useCompra(id) {
  return useQuery({
    queryKey: ['compras', 'detalhe', id],
    queryFn: () => api(`/api/compras/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
}

// { id?, fornecedorId, itens: [{ produtoId, quantidade, custoUnitario }], observacoes }
export function useSalvarCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }) =>
      id ? api(`/api/compras/${id}`, { method: 'PUT', body: dados }) : api('/api/compras', { method: 'POST', body: dados }),
    onSuccess: () => invalidar(queryClient, 'compras', 'auditoria'),
  });
}

// Receber mexe em estoque, custo dos produtos e financeiro: invalida tudo
export function useReceberCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, atualizarCusto }) => api(`/api/compras/${id}/receber`, { method: 'POST', body: { atualizarCusto } }),
    onSuccess: () => invalidar(queryClient),
  });
}

export function useCancelarCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }) => api(`/api/compras/${id}/cancelar`, { method: 'POST', body: { motivo } }),
    onSuccess: () => invalidar(queryClient, 'compras', 'auditoria'),
  });
}
