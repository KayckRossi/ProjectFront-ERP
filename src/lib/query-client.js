import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 15_000,
			// Só tenta de novo em falhas de rede (status 0) ou do servidor (5xx); erros 4xx são definitivos
			retry: (falhas, erro) => falhas < 2 && (erro?.status === 0 || erro?.status >= 500),
		},
		mutations: {
			retry: false,
		},
	},
});

// Invalida as consultas cujas chaves começam com os prefixos informados.
// Sem prefixos, invalida tudo (usado após vendas, que afetam quase todas as telas).
export function invalidar(queryClient, ...prefixos) {
	if (!prefixos.length) return queryClient.invalidateQueries();
	return Promise.all(prefixos.map((prefixo) => queryClient.invalidateQueries({ queryKey: [prefixo] })));
}
