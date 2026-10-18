import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, comParametros } from '@/api/http';

export function useKpisDashboard() {
  return useQuery({ queryKey: ['dashboard', 'kpis'], queryFn: () => api('/api/dashboard/kpis') });
}

// periodo: { dataInicio, dataFim } no formato AAAA-MM-DD
function useRelatorio(nome, periodo, extras = {}) {
  const parametros = { ...periodo, ...extras };
  return useQuery({
    queryKey: ['relatorios', nome, parametros],
    queryFn: () => api(comParametros(`/api/relatorios/${nome}`, parametros)),
    placeholderData: keepPreviousData,
  });
}

export const useVendasPorDia = (periodo) => useRelatorio('vendas-por-dia', periodo);
export const useVendasPorCategoria = (periodo) => useRelatorio('vendas-por-categoria', periodo);
export const useProdutosMaisVendidos = (periodo, limite = 5) => useRelatorio('produtos-mais-vendidos', periodo, { limite });
export const useMelhoresClientes = (periodo, limite = 5) => useRelatorio('melhores-clientes', periodo, { limite });
