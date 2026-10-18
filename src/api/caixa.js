import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';
import { invalidar } from '@/lib/query-client';

// Caixa aberto do usuário logado, ou null (204) quando ele não tem caixa aberto
export function useCaixaAtual(opcoes = {}) {
  return useQuery({ queryKey: ['caixa', 'atual'], queryFn: () => api('/api/caixa/atual'), ...opcoes });
}

// filtros: { dataInicio, dataFim, status, usuarioId }
export function useSessoesCaixa(filtros, opcoes = {}) {
  return useQuery({
    queryKey: ['caixa', 'sessoes', filtros],
    queryFn: () => api(comParametros('/api/caixa/sessoes', filtros)),
    placeholderData: keepPreviousData,
    ...opcoes,
  });
}

export function useSessaoCaixa(id) {
  return useQuery({
    queryKey: ['caixa', 'sessao', id],
    queryFn: () => api(`/api/caixa/sessoes/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
}

function useAcaoCaixa(caminho) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados) => api(`/api/caixa/${caminho}`, { method: 'POST', body: dados }),
    onSuccess: (sessao) => {
      // Fechar devolve a sessão fechada; o "atual" passa a ser nenhum
      queryClient.setQueryData(['caixa', 'atual'], sessao.status === 'aberta' ? sessao : null);
      return invalidar(queryClient, 'caixa', 'auditoria');
    },
  });
}

export const useAbrirCaixa = () => useAcaoCaixa('abrir');
// { tipo: 'sangria' | 'suprimento', valor, motivo }
export const useMovimentarCaixa = () => useAcaoCaixa('movimentos');
// { valorContado, observacoes }
export const useFecharCaixa = () => useAcaoCaixa('fechar');
