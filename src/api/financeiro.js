import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';
import { invalidar } from '@/lib/query-client';

// Categorias aceitas no lançamento manual (o backend valida a mesma lista)
export const CATEGORIAS_TRANSACAO = {
  saida: ['Fornecedores', 'Fixos', 'Pessoal', 'Impostos', 'Outros'],
  entrada: ['Vendas', 'Serviços', 'Outros'],
};

// filtros: { dataInicio, dataFim, tipo }
export function useTransacoes(filtros) {
  return useQuery({
    queryKey: ['transacoes', filtros],
    queryFn: () => api(comParametros('/api/financeiro/transacoes', filtros)),
    placeholderData: keepPreviousData,
  });
}

export function useFinanceiroMensal(meses = 6) {
  return useQuery({
    queryKey: ['financeiro-mensal', meses],
    queryFn: () => api(comParametros('/api/financeiro/mensal', { meses })),
  });
}

export function useCriarTransacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transacao) => api('/api/financeiro/transacoes', { method: 'POST', body: transacao }),
    onSuccess: () => invalidar(queryClient, 'transacoes', 'financeiro-mensal'),
  });
}
