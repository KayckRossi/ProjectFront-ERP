// Recursos REST da API e hooks do React Query usados pelas telas.
import { useCallback, type SetStateAction } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/http';
import type { Account, Customer, Product, Sale, Seller, Supplier, User } from '@/types';

export interface Recurso<T extends { id: string }> {
  chave: string;
  listar: () => Promise<T[]>;
  criar: (item: Omit<T, 'id'>) => Promise<T>;
  atualizar: (id: string, item: T) => Promise<T>;
  remover: (id: string) => Promise<void>;
}

// O id é gerado pelo backend: o que a tela inventa para um registro novo não vai na requisição
const semId = <T extends { id: string }>({ id: _id, ...resto }: T) => resto;

function recurso<T extends { id: string }>(caminho: string): Recurso<T> {
  return {
    chave: caminho,
    listar: () => api<T[]>(caminho),
    criar: (item) => api<T>(caminho, { method: 'POST', body: item }),
    atualizar: (id, item) => api<T>(`${caminho}/${id}`, { method: 'PUT', body: semId(item) }),
    remover: (id) => api<void>(`${caminho}/${id}`, { method: 'DELETE' }),
  };
}

export const produtosApi = recurso<Product>('/api/produtos');
export const clientesApi = recurso<Customer>('/api/clientes');
export const fornecedoresApi = recurso<Supplier>('/api/fornecedores');
export const vendedoresApi = recurso<Seller>('/api/vendedores');
export const vendasApi = recurso<Sale>('/api/vendas');
export const contasReceberApi = recurso<Account>('/api/contas-receber');
export const contasPagarApi = recurso<Account>('/api/contas-pagar');
export const usuariosApi = recurso<User>('/api/usuarios');

const avisarErro = (erro: unknown) => toast.error(erro instanceof Error ? erro.message : 'Não foi possível salvar.');

export function useLista<T extends { id: string }>(r: Recurso<T>) {
  return useQuery({ queryKey: [r.chave], queryFn: r.listar });
}

// Funciona como useState: a tela altera a lista como sempre fez e cada diferença
// (item novo, alterado ou removido) vira POST, PUT ou DELETE no backend.
export function useColecao<T extends { id: string }>(r: Recurso<T>) {
  const queryClient = useQueryClient();
  const { data = [] } = useLista(r);

  const definir = useCallback((acao: SetStateAction<T[]>) => {
    const antes = queryClient.getQueryData<T[]>([r.chave]) ?? [];
    const depois = typeof acao === 'function' ? acao(antes) : acao;
    queryClient.setQueryData([r.chave], depois);

    const anteriores = new Map(antes.map((item) => [item.id, item]));
    const atuais = new Set(depois.map((item) => item.id));
    const operacoes: Promise<unknown>[] = [];
    for (const item of depois) {
      const anterior = anteriores.get(item.id);
      if (!anterior) operacoes.push(r.criar(semId(item) as Omit<T, 'id'>));
      else if (anterior !== item) operacoes.push(r.atualizar(item.id, item));
    }
    for (const id of anteriores.keys()) if (!atuais.has(id)) operacoes.push(r.remover(id));

    Promise.all(operacoes)
      .catch(avisarErro)
      .finally(() => queryClient.invalidateQueries({ queryKey: [r.chave] }));
  }, [queryClient, r]);

  return [data, definir] as const;
}

export function useCategorias() {
  return useQuery({ queryKey: ['/api/categorias'], queryFn: () => api<string[]>('/api/categorias') });
}

export function useFormasPagamento() {
  return useQuery({ queryKey: ['/api/formas-pagamento'], queryFn: () => api<string[]>('/api/formas-pagamento') });
}

// A venda é criada pelo backend, que também baixa o estoque: produtos e vendas são recarregados
export function useRegistrarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (venda: Omit<Sale, 'id' | 'createdAt'>) => api<Sale>('/api/vendas', { method: 'POST', body: venda }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [vendasApi.chave] });
      queryClient.invalidateQueries({ queryKey: [produtosApi.chave] });
    },
    onError: avisarErro,
  });
}
