import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';
import { invalidar } from '@/lib/query-client';

// Caixa do usuário logado no PDV. O histórico de caixas fica no Nexora Backoffice.

// Caixa aberto do usuário logado, ou null (204) quando ele não tem caixa aberto
export function useCaixaAtual(opcoes = {}) {
  return useQuery({ queryKey: ['caixa', 'atual'], queryFn: () => api('/api/caixa/atual'), ...opcoes });
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
