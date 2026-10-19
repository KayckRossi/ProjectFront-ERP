// Servidor de demonstração: responde às mesmas rotas que o backend real (CONTRATO_API_BACKEND.md),
// guardando os dados no navegador. Serve de implementação de referência do contrato.
import { ApiError } from '@/lib/http';
import {
  categories,
  mockAccountsPayable,
  mockAccountsReceivable,
  mockCustomers,
  mockProducts,
  mockSales,
  mockSellers,
  mockSuppliers,
  mockUsers,
  paymentMethods,
} from '@/data/mockData';
import type { Product, Sale, User } from '@/types';

const CHAVE = 'nexo365_demo_v1';

type Registro = { id: string } & Record<string, unknown>;
type Banco = Record<string, Registro[]>;

const SEMENTE = (): Banco => JSON.parse(JSON.stringify({
  produtos: mockProducts,
  clientes: mockCustomers,
  fornecedores: mockSuppliers,
  vendedores: mockSellers,
  vendas: mockSales,
  'contas-receber': mockAccountsReceivable,
  'contas-pagar': mockAccountsPayable,
  usuarios: mockUsers,
}));

let banco: Banco | null = null;

function carregar(): Banco {
  if (banco) return banco;
  try {
    const salvo = localStorage.getItem(CHAVE);
    banco = salvo ? { ...SEMENTE(), ...JSON.parse(salvo) } : SEMENTE();
  } catch {
    banco = SEMENTE();
  }
  return banco!;
}

function gravar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(banco)); } catch { /* storage indisponível */ }
}

export function restaurarDemonstracao() {
  banco = SEMENTE();
  gravar();
}

const novoId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(16).slice(2)}`);
const atraso = () => new Promise((resolve) => setTimeout(resolve, 120));
const copia = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor));

function usuarioDoToken(token: string | null): User | null {
  const id = token?.startsWith('demo:') ? token.slice(5) : null;
  return (carregar().usuarios.find((u) => u.id === id) as unknown as User) ?? null;
}

export async function responderDemo<T>(method: string, caminho: string, body: unknown, token: string | null): Promise<T> {
  await atraso();
  const [rota] = caminho.split('?');
  const partes = rota.replace(/^\/api\//, '').split('/').filter(Boolean);
  const dados = carregar();

  if (rota === '/api/auth/login' && method === 'POST') {
    // Modo demonstração: qualquer e-mail e senha entram; o e-mail de um usuário cadastrado entra como ele
    const { email } = (body ?? {}) as { email?: string };
    const usuario = dados.usuarios.find((u) => u.email === email && u.active !== false) ?? dados.usuarios[0];
    return { access_token: `demo:${usuario.id}`, user: copia(usuario) } as T;
  }

  const usuario = usuarioDoToken(token);
  if (!usuario) throw new ApiError(401, 'Sessão expirada. Entre novamente.');

  if (rota === '/api/auth/me') return copia(usuario) as T;
  if (rota === '/api/auth/logout') return null as T;
  if (rota === '/api/categorias') return [...categories] as T;
  if (rota === '/api/formas-pagamento') return [...paymentMethods] as T;

  const [colecao, id] = partes;
  const lista = dados[colecao];
  if (!lista) throw new ApiError(404, `Rota não encontrada: ${method} ${rota}`);

  if (method === 'GET' && !id) return copia(lista) as T;
  if (method === 'POST' && !id) {
    const agora = new Date().toISOString();
    const registro = { ...(body as Registro), id: novoId(), createdAt: agora };
    if (colecao === 'vendas') baixarEstoque(registro as unknown as Sale);
    lista.push(registro);
    gravar();
    return copia(registro) as T;
  }

  const indice = lista.findIndex((r) => r.id === id);
  if (indice < 0) throw new ApiError(404, 'Registro não encontrado.');
  if (method === 'GET') return copia(lista[indice]) as T;
  if (method === 'PUT' || method === 'PATCH') {
    lista[indice] = { ...(method === 'PATCH' ? lista[indice] : {}), ...(body as Registro), id: id! };
    gravar();
    return copia(lista[indice]) as T;
  }
  if (method === 'DELETE') {
    lista.splice(indice, 1);
    gravar();
    return null as T;
  }
  throw new ApiError(405, `Método não suportado: ${method} ${rota}`);
}

// Regra de negócio que o backend também deve aplicar: a venda baixa o estoque dos produtos vendidos
function baixarEstoque(venda: Sale) {
  const produtos = carregar().produtos as unknown as Product[];
  for (const item of venda.items ?? []) {
    const produto = produtos.find((p) => p.id === item.product.id);
    if (produto) produto.stock -= item.quantity;
  }
}
