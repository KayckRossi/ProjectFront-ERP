// Testes de contrato (CONTRATO_API_BACKEND.md). Por padrão rodam contra o servidor de demonstração;
// com CONTRATO_API_URL rodam contra um backend real (use um banco de testes: criam e apagam registros).
import { beforeAll, describe, expect, it } from 'vitest';
import { api, ApiError, tokenStorage } from '@/lib/http';
import { entrar } from '@/lib/auth';
import { clientesApi, produtosApi } from '@/api/recursos';
import type { Customer, Product, User } from '@/types';

declare const process: { env: Record<string, string | undefined> };
const { CONTRATO_API_URL, CONTRATO_EMAIL = 'admin@gestao.com', CONTRATO_SENHA = 'demo' } = process.env;

const COLECOES = ['produtos', 'clientes', 'fornecedores', 'vendedores', 'vendas', 'contas-receber', 'contas-pagar', 'usuarios'];

async function login() {
  return entrar(CONTRATO_EMAIL, CONTRATO_SENHA, true);
}

beforeAll(async () => {
  localStorage.clear();
  if (CONTRATO_API_URL) localStorage.setItem('nexo365_api_url', CONTRATO_API_URL);
  await login();
});

describe(`contrato da API (${CONTRATO_API_URL ?? 'servidor de demonstração'})`, () => {
  it('login devolve token e usuário sem senha; /auth/me devolve o mesmo usuário', async () => {
    const usuario = await login();
    expect(tokenStorage.obter()).toBeTruthy();
    expect(usuario).toMatchObject({ id: expect.any(String), email: expect.any(String), role: expect.any(String) });
    expect(usuario).not.toHaveProperty('password');
    const eu = await api<User>('/api/auth/me');
    expect(eu.id).toBe(usuario.id);
  });

  it('credenciais erradas recebem 401', async () => {
    if (!CONTRATO_API_URL) return; // no modo demonstração qualquer senha entra
    await expect(entrar(CONTRATO_EMAIL, `${CONTRATO_SENHA}-errada`)).rejects.toMatchObject({ status: 401 });
    await login();
  });

  it('rotas sem token recebem 401', async () => {
    tokenStorage.limpar();
    await expect(api('/api/produtos')).rejects.toBeInstanceOf(ApiError);
    await expect(api('/api/produtos')).rejects.toMatchObject({ status: 401 });
    await login();
  });

  it.each(COLECOES)('GET /api/%s devolve um array de registros com id string', async (colecao) => {
    const lista = await api<{ id: unknown }[]>(`/api/${colecao}`);
    expect(Array.isArray(lista)).toBe(true);
    for (const item of lista) expect(typeof item.id).toBe('string');
  });

  it('listas auxiliares são arrays de texto', async () => {
    for (const rota of ['/api/categorias', '/api/formas-pagamento']) {
      const lista = await api<unknown[]>(rota);
      expect(lista.length).toBeGreaterThan(0);
      expect(lista.every((v) => typeof v === 'string')).toBe(true);
    }
  });

  it('CRUD completo de clientes', async () => {
    const novo: Omit<Customer, 'id'> = {
      name: 'Cliente Contrato', document: '123.456.789-00', email: 'contrato@exemplo.com', phone: '(11) 99999-0000',
      address: 'Rua Teste, 1', city: 'São Paulo', state: 'SP', zipCode: '01000-000', notes: '', active: true, createdAt: new Date(),
    };
    const criado = await clientesApi.criar(novo);
    expect(criado.id).toEqual(expect.any(String));
    expect(criado.createdAt).toBeInstanceOf(Date);
    expect(criado.name).toBe(novo.name);

    const atualizado = await clientesApi.atualizar(criado.id, { ...criado, city: 'Campinas' });
    expect(atualizado).toMatchObject({ id: criado.id, city: 'Campinas' });
    expect((await api<Customer>(`/api/clientes/${criado.id}`)).city).toBe('Campinas');

    await clientesApi.remover(criado.id);
    await expect(api(`/api/clientes/${criado.id}`)).rejects.toMatchObject({ status: 404 });
  });

  it('venda registrada baixa o estoque do produto', async () => {
    const produto = await produtosApi.criar({
      code: `CT${Date.now()}`, barcode: `789${Date.now()}`, name: 'Produto Contrato', description: '', category: 'Outros',
      price: 10, cost: 6, stock: 10, minStock: 1, unit: 'UN', supplierId: '', active: true, createdAt: new Date(), updatedAt: new Date(),
    });
    await api('/api/vendas', {
      method: 'POST',
      body: {
        items: [{ product: produto, quantity: 3, discount: 0, subtotal: 30 }],
        subtotal: 30, discount: 0, total: 30, paymentMethod: 'Dinheiro', status: 'completed',
      },
    });
    expect((await api<Product>(`/api/produtos/${produto.id}`)).stock).toBe(7);
    await produtosApi.remover(produto.id);
  });
});
