import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColecao, type Recurso } from './recursos';

type Item = { id: string; nome: string };

function recursoFalso(inicial: Item[]) {
  let dados = [...inicial];
  const r: Recurso<Item> = {
    chave: `/api/teste-${Math.random()}`,
    listar: vi.fn(async () => dados),
    criar: vi.fn(async (item) => { const novo = { ...item, id: `srv-${dados.length + 1}` } as Item; dados = [...dados, novo]; return novo; }),
    atualizar: vi.fn(async (id, item) => { dados = dados.map((d) => (d.id === id ? item : d)); return item; }),
    remover: vi.fn(async (id) => { dados = dados.filter((d) => d.id !== id); }),
  };
  return r;
}

function montar(r: Recurso<Item>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => useColecao(r), { wrapper });
}

describe('useColecao', () => {
  it('transforma cada alteração da lista em POST, PUT ou DELETE', async () => {
    const r = recursoFalso([{ id: '1', nome: 'A' }, { id: '2', nome: 'B' }]);
    const { result } = montar(r);
    await waitFor(() => expect(result.current[0]).toHaveLength(2));

    act(() => result.current[1]((lista) => [...lista, { id: 'temporario', nome: 'C' }]));
    await waitFor(() => expect(r.criar).toHaveBeenCalledWith({ nome: 'C' }));
    await waitFor(() => expect(result.current[0].map((i) => i.id)).toEqual(['1', '2', 'srv-3']));

    act(() => result.current[1]((lista) => lista.map((i) => (i.id === '1' ? { ...i, nome: 'A2' } : i))));
    await waitFor(() => expect(r.atualizar).toHaveBeenCalledWith('1', { id: '1', nome: 'A2' }));

    act(() => result.current[1]((lista) => lista.filter((i) => i.id !== '2')));
    await waitFor(() => expect(r.remover).toHaveBeenCalledWith('2'));

    // itens que não mudaram não geram requisição
    expect(r.atualizar).toHaveBeenCalledTimes(1);
    expect(r.criar).toHaveBeenCalledTimes(1);
  });
});
