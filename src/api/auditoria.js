import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';

export const ENTIDADES_AUDITORIA = {
  sessao: 'Acesso',
  usuario: 'Usuário',
  produto: 'Produto',
  categoria: 'Categoria',
  estoque: 'Estoque',
  cliente: 'Cliente',
  venda: 'Venda',
  pedido: 'Pedido',
  transacao: 'Financeiro',
  fornecedor: 'Fornecedor',
  compra: 'Compra',
  caixa: 'Caixa',
  configuracoes: 'Configurações',
};

// filtros: { dataInicio, dataFim, usuarioId, entidade, busca }
export function useAuditoria(filtros) {
  return useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => api(comParametros('/api/auditoria', filtros)),
    placeholderData: keepPreviousData,
  });
}
