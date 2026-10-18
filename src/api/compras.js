import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';

// Compras são gerenciadas no Nexora Backoffice; aqui só a lista usada no alerta do sino.
// filtros: { dataInicio, dataFim, status, fornecedorId, busca }
export function useCompras(filtros, opcoes = {}) {
  return useQuery({
    queryKey: ['compras', 'lista', filtros],
    queryFn: () => api(comParametros('/api/compras', filtros)),
    placeholderData: keepPreviousData,
    ...opcoes,
  });
}
