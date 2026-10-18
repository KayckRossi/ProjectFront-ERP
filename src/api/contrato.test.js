// Testes do CONTRATO_API_BACKEND.md.
//
// Sem variáveis de ambiente, rodam contra o servidor de demonstração (implementação de referência).
// Para validar o backend real (use um banco de testes, pois os testes criam e apagam registros):
//   CONTRATO_API_URL=http://localhost:3000 CONTRATO_EMAIL=admin@empresa.com CONTRATO_SENHA=segredo npm run test:contrato
import { beforeAll, describe, expect, it } from 'vitest';
import { criarServidorDemo } from './demo/servidor.js';
import { dataLocalISO, somarDias } from '../lib/datas.js';

const URL_BACKEND = (process.env.CONTRATO_API_URL || '').replace(/\/+$/, '');
const contraBackendReal = Boolean(URL_BACKEND);

// Devolve uma função (método, caminho, body) => { status, corpo }
async function criarClienteApi() {
  if (!contraBackendReal) {
    const memoria = new Map();
    const storage = {
      getItem: (chave) => memoria.get(chave) ?? null,
      setItem: (chave, valor) => memoria.set(chave, valor),
      removeItem: (chave) => memoria.delete(chave),
    };
    const servidor = criarServidorDemo({ storage });
    return async (metodo, caminho, body) => servidor.responder(metodo, caminho, body);
  }

  const requisitar = async (metodo, caminho, body, token) => {
    const resposta = await fetch(URL_BACKEND + caminho, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const texto = await resposta.text();
    let corpo = null;
    try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = texto; }
    return { status: resposta.status, corpo };
  };

  const login = await requisitar('POST', '/api/auth/login', { email: process.env.CONTRATO_EMAIL, password: process.env.CONTRATO_SENHA });
  if (login.status !== 200 || !login.corpo?.access_token) {
    throw new Error(`Login falhou (status ${login.status}). Defina CONTRATO_EMAIL e CONTRATO_SENHA de um usuário válido.`);
  }
  const token = login.corpo.access_token;
  const api = (metodo, caminho, body) => requisitar(metodo, caminho, body, token);
  api.semToken = (metodo, caminho, body) => requisitar(metodo, caminho, body);
  return api;
}

// Mesma regra da seção 3 do contrato
function statusEsperado({ estoque, estoqueMinimo }) {
  if (estoque === 0) return 'Sem Estoque';
  if (estoque < estoqueMinimo) return 'Crítico';
  if (estoque < estoqueMinimo * 1.5) return 'Baixo';
  return 'OK';
}

function esperarErro(resposta, status) {
  expect(resposta.status, JSON.stringify(resposta.corpo)).toBe(status);
  expect(typeof resposta.corpo?.mensagem, 'erros devem ter o campo "mensagem"').toBe('string');
}

const esperarSucesso = (resposta, status = 200) => expect(resposta.status, JSON.stringify(resposta.corpo)).toBe(status);

// Valores únicos para poder rodar várias vezes contra o mesmo banco
const sufixo = String(Date.now()).slice(-7);
const hoje = dataLocalISO();

let api;
let categoria;
let produto;
let cliente;
let venda;

beforeAll(async () => {
  api = await criarClienteApi();
});

describe(`Contrato da API (${contraBackendReal ? URL_BACKEND : 'servidor de demonstração'})`, () => {
  describe.runIf(contraBackendReal)('1. Autenticação', () => {
    it('login com senha errada responde 401 com mensagem', async () => {
      esperarErro(await api.semToken('POST', '/api/auth/login', { email: process.env.CONTRATO_EMAIL, password: `errada-${sufixo}` }), 401);
    });

    it('GET /api/auth/me sem token responde 401 e com token devolve o usuário', async () => {
      expect((await api.semToken('GET', '/api/auth/me')).status).toBe(401);
      const eu = await api('GET', '/api/auth/me');
      esperarSucesso(eu);
      expect(eu.corpo).toMatchObject({ id: expect.anything(), email: expect.any(String), nome: expect.any(String) });
    });
  });

  describe('2. Produtos e categorias', () => {
    it('lista categorias com id, nome e cor', async () => {
      const resposta = await api('GET', '/api/categorias');
      esperarSucesso(resposta);
      expect(resposta.corpo.length).toBeGreaterThan(0);
      categoria = resposta.corpo[0];
      expect(categoria).toMatchObject({ id: expect.any(String), nome: expect.any(String), cor: expect.any(String) });
    });

    it('recusa produto inválido com 400', async () => {
      const base = { nome: 'Inválido', categoria: categoria.id, custo: 2, estoque: 1, estoqueMinimo: 0 };
      esperarErro(await api('POST', '/api/produtos', { ...base, preco: 0 }), 400);
      esperarErro(await api('POST', '/api/produtos', { ...base, preco: 1 }), 400); // abaixo do custo
      esperarErro(await api('POST', '/api/produtos', { ...base, nome: '', preco: 5 }), 400);
    });

    it('cria produto (201), gera código de barras e devolve o registro completo', async () => {
      const resposta = await api('POST', '/api/produtos', {
        nome: `Produto Contrato ${sufixo}`, sku: `ct${sufixo}`, categoria: categoria.id, custo: 2, preco: 5.5, estoque: 10, estoqueMinimo: 3,
      });
      esperarSucesso(resposta, 201);
      produto = resposta.corpo;
      expect(produto).toMatchObject({ id: expect.anything(), nome: `Produto Contrato ${sufixo}`, sku: `CT${sufixo}`, preco: 5.5, custo: 2, estoque: 10, estoqueMinimo: 3 });
      expect(produto.codigoBarras).toMatch(/^\d{8,14}$/);
    });

    it('recusa SKU duplicado com 409', async () => {
      esperarErro(await api('POST', '/api/produtos', {
        nome: 'Duplicado', sku: `CT${sufixo}`, categoria: categoria.id, custo: 1, preco: 2, estoque: 0, estoqueMinimo: 0,
      }), 409);
    });

    it('PUT atualiza e devolve o produto, mantendo o código de barras', async () => {
      const resposta = await api('PUT', `/api/produtos/${produto.id}`, { ...produto, codigoBarras: undefined, preco: 6 });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: produto.id, preco: 6, codigoBarras: produto.codigoBarras });
      produto = resposta.corpo;
    });

    it('busca por nome, SKU e código de barras', async () => {
      for (const consulta of [`busca=contrato%20${sufixo}`, `busca=ct${sufixo}`, `codigoBarras=${produto.codigoBarras}`]) {
        const resposta = await api('GET', `/api/produtos?${consulta}`);
        esperarSucesso(resposta);
        expect(resposta.corpo.map((p) => p.id), consulta).toContain(produto.id);
      }
    });

    it('produto inexistente responde 404', async () => {
      esperarErro(await api('PUT', `/api/produtos/nao-existe-${sufixo}`, { ...produto }), 404);
    });
  });

  describe('3. Estoque', () => {
    it('GET /api/estoque calcula o status pela regra do contrato', async () => {
      const resposta = await api('GET', '/api/estoque');
      esperarSucesso(resposta);
      for (const item of resposta.corpo) expect(item.status, item.nome).toBe(statusEsperado(item));
      expect(resposta.corpo.map((p) => p.id)).toContain(produto.id);
    });

    it('filtro=sem-estoque traz só produtos zerados', async () => {
      const resposta = await api('GET', '/api/estoque?filtro=sem-estoque');
      esperarSucesso(resposta);
      expect(resposta.corpo.every((p) => p.estoque === 0)).toBe(true);
    });

    it('entrada soma ao estoque e devolve o produto com status', async () => {
      const resposta = await api('POST', '/api/estoque/movimentacoes', { produtoId: produto.id, tipo: 'entrada', quantidade: 5 });
      esperarSucesso(resposta, 201);
      expect(resposta.corpo).toMatchObject({ id: produto.id, estoque: 15, status: 'OK' });
    });

    it('recusa saída maior que o estoque (409) e quantidade inválida (400)', async () => {
      esperarErro(await api('POST', '/api/estoque/movimentacoes', { produtoId: produto.id, tipo: 'saida', quantidade: 999 }), 409);
      esperarErro(await api('POST', '/api/estoque/movimentacoes', { produtoId: produto.id, tipo: 'saida', quantidade: 1.5 }), 400);
    });
  });

  describe('4. Clientes', () => {
    const cpf = `${sufixo}0000`.slice(0, 11).padEnd(11, '7');
    const documento = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

    it('recusa documento, telefone e e-mail inválidos (400)', async () => {
      esperarErro(await api('POST', '/api/clientes', { nome: 'X', documento: '123.45' }), 400);
      esperarErro(await api('POST', '/api/clientes', { nome: 'X', telefone: '(11) 123' }), 400);
      esperarErro(await api('POST', '/api/clientes', { nome: 'X', email: 'sem-arroba' }), 400);
      esperarErro(await api('POST', '/api/clientes', { nome: '' }), 400);
    });

    it('cria cliente (201) com totalCompras 0', async () => {
      const resposta = await api('POST', '/api/clientes', {
        nome: `Cliente Contrato ${sufixo}`, documento, telefone: '(11) 98888-7777', email: `contrato${sufixo}@teste.com`,
      });
      esperarSucesso(resposta, 201);
      cliente = resposta.corpo;
      expect(cliente).toMatchObject({ id: expect.anything(), documento, totalCompras: 0 });
    });

    it('recusa documento duplicado com 409', async () => {
      esperarErro(await api('POST', '/api/clientes', { nome: 'Outro', documento }), 409);
    });

    it('busca pelo documento usando só os dígitos', async () => {
      const resposta = await api('GET', `/api/clientes?busca=${cpf}`);
      esperarSucesso(resposta);
      expect(resposta.corpo.map((c) => c.id)).toContain(cliente.id);
    });
  });

  describe('5 e 6. Vendas e pedidos', () => {
    // 3 x R$ 6,00 = 18,00; 10% de desconto = 1,80; total 16,20; recebido 20,00; troco 3,80
    const novaVenda = () => ({
      clienteId: cliente.id,
      formaPagamento: 'dinheiro',
      descontoPercentual: 10,
      subtotal: 18,
      desconto: 1.8,
      total: 16.2,
      valorRecebido: 20,
      troco: 3.8,
      itens: [{ produtoId: produto.id, quantidade: 3, precoUnitario: 6 }],
    });

    it('recusa venda acima do estoque (409), total divergente (400) e dinheiro insuficiente (400)', async () => {
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), itens: [{ produtoId: produto.id, quantidade: 999, precoUnitario: 6 }], subtotal: undefined, desconto: undefined, total: undefined }), 409);
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), total: 10 }), 400);
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), valorRecebido: 5 }), 400);
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), itens: [] }), 400);
    });

    it('registra a venda (201) e devolve a venda completa', async () => {
      const resposta = await api('POST', '/api/vendas', novaVenda());
      esperarSucesso(resposta, 201);
      venda = resposta.corpo;
      expect(venda).toMatchObject({
        id: expect.anything(),
        numero: expect.any(Number),
        pedidoId: expect.anything(),
        clienteId: cliente.id,
        cliente: cliente.nome,
        status: 'Concluída',
        formaPagamento: 'dinheiro',
        subtotal: 18,
        desconto: 1.8,
        total: 16.2,
        valorRecebido: 20,
        troco: 3.8,
      });
      expect(venda.itens).toEqual([expect.objectContaining({ produtoId: produto.id, quantidade: 3, precoUnitario: 6, totalItem: 18 })]);
    });

    it('a venda baixa o estoque e soma ao total do cliente', async () => {
      const produtos = await api('GET', `/api/produtos?busca=ct${sufixo}`);
      expect(produtos.corpo.find((p) => p.id === produto.id).estoque).toBe(12);
      const clientes = await api('GET', `/api/clientes?busca=${encodeURIComponent(cliente.email)}`);
      expect(clientes.corpo.find((c) => c.id === cliente.id).totalCompras).toBe(16.2);
    });

    it('a venda cria pedido pendente no Kanban e entrada no financeiro', async () => {
      const pedidos = await api('GET', '/api/pedidos');
      expect(pedidos.corpo.find((p) => p.id === venda.pedidoId)).toMatchObject({ status: 'pendente', total: 16.2, pagamento: 'Dinheiro' });
      const transacoes = await api('GET', `/api/financeiro/transacoes?dataInicio=${hoje}&dataFim=${hoje}&tipo=entrada`);
      expect(transacoes.corpo).toContainEqual(expect.objectContaining({ descricao: `Venda PDV #${venda.numero}`, tipo: 'entrada', valor: 16.2, categoria: 'Vendas', data: hoje }));
    });

    it('a venda aparece no detalhe, na listagem por cliente, por número e nas recentes', async () => {
      const detalhe = await api('GET', `/api/vendas/${venda.id}`);
      esperarSucesso(detalhe);
      expect(detalhe.corpo.itens).toHaveLength(1);
      const porCliente = await api('GET', `/api/vendas?clienteId=${cliente.id}&dataInicio=${hoje}&dataFim=${hoje}`);
      expect(porCliente.corpo.map((v) => v.id)).toContain(venda.id);
      const porNumero = await api('GET', `/api/vendas?numero=${venda.numero}`);
      expect(porNumero.corpo.map((v) => v.id)).toEqual([venda.id]);
      const recentes = await api('GET', '/api/vendas/recentes?limite=50');
      expect(recentes.corpo.map((v) => v.id)).toContain(venda.id);
    });

    it('move o pedido no Kanban e recusa status inválido', async () => {
      esperarErro(await api('PATCH', `/api/pedidos/${venda.pedidoId}/status`, { status: 'entregue' }), 400);
      const resposta = await api('PATCH', `/api/pedidos/${venda.pedidoId}/status`, { status: 'em_preparo' });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: venda.pedidoId, status: 'em_preparo' });
    });

    it('cancelamento desfaz os efeitos e não pode ser repetido', async () => {
      const resposta = await api('POST', `/api/vendas/${venda.id}/cancelar`, { motivo: 'Teste de contrato' });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: venda.id, status: 'Cancelada', motivoCancelamento: 'Teste de contrato' });

      const produtos = await api('GET', `/api/produtos?busca=ct${sufixo}`);
      expect(produtos.corpo.find((p) => p.id === produto.id).estoque).toBe(15);
      const clientes = await api('GET', `/api/clientes?busca=${encodeURIComponent(cliente.email)}`);
      expect(clientes.corpo.find((c) => c.id === cliente.id).totalCompras).toBe(0);
      const pedidos = await api('GET', '/api/pedidos');
      expect(pedidos.corpo.map((p) => p.id)).not.toContain(venda.pedidoId);
      const transacoes = await api('GET', `/api/financeiro/transacoes?dataInicio=${hoje}&dataFim=${hoje}&tipo=saida`);
      expect(transacoes.corpo).toContainEqual(expect.objectContaining({ tipo: 'saida', valor: 16.2, categoria: 'Estornos' }));

      esperarErro(await api('POST', `/api/vendas/${venda.id}/cancelar`, {}), 409);
    });
  });

  describe('7. Financeiro', () => {
    it('lança movimentação manual (201) e recusa categoria inválida (400)', async () => {
      const dados = { descricao: `Despesa contrato ${sufixo}`, tipo: 'saida', valor: 12.34, categoria: 'Outros', data: hoje };
      const resposta = await api('POST', '/api/financeiro/transacoes', dados);
      esperarSucesso(resposta, 201);
      expect(resposta.corpo).toMatchObject({ id: expect.anything(), ...dados });
      esperarErro(await api('POST', '/api/financeiro/transacoes', { ...dados, categoria: 'Vendas' }), 400);
      esperarErro(await api('POST', '/api/financeiro/transacoes', { ...dados, valor: 0 }), 400);
    });

    it('balanço mensal devolve os meses em ordem, terminando no mês atual', async () => {
      const resposta = await api('GET', '/api/financeiro/mensal?meses=3');
      esperarSucesso(resposta);
      expect(resposta.corpo).toHaveLength(3);
      expect(resposta.corpo.map((m) => m.anoMes)).toEqual([...resposta.corpo.map((m) => m.anoMes)].sort());
      expect(resposta.corpo.at(-1).anoMes).toBe(hoje.slice(0, 7));
      for (const mes of resposta.corpo) expect(mes).toMatchObject({ mes: expect.any(String), receitas: expect.any(Number), despesas: expect.any(Number) });
    });
  });

  describe('8. Dashboard e relatórios', () => {
    it('KPIs são numéricos', async () => {
      const resposta = await api('GET', '/api/dashboard/kpis');
      esperarSucesso(resposta);
      for (const campo of ['vendasHoje', 'quantidadeVendasHoje', 'ticketMedio', 'produtosEmBaixa', 'faturamentoMensal']) {
        expect(typeof resposta.corpo[campo], campo).toBe('number');
      }
    });

    it('vendas-por-dia traz todos os dias do período, inclusive sem venda', async () => {
      const resposta = await api('GET', `/api/relatorios/vendas-por-dia?dataInicio=${somarDias(hoje, -2)}&dataFim=${hoje}`);
      esperarSucesso(resposta);
      expect(resposta.corpo.map((d) => d.data)).toEqual([somarDias(hoje, -2), somarDias(hoje, -1), hoje]);
      expect(resposta.corpo[2]).toMatchObject({ dia: `${hoje.slice(8, 10)}/${hoje.slice(5, 7)}`, vendas: expect.any(Number) });
    });

    it('recusa período invertido ou maior que 366 dias (400)', async () => {
      esperarErro(await api('GET', `/api/relatorios/vendas-por-dia?dataInicio=${hoje}&dataFim=${somarDias(hoje, -1)}`), 400);
      esperarErro(await api('GET', `/api/relatorios/vendas-por-dia?dataInicio=${somarDias(hoje, -400)}&dataFim=${hoje}`), 400);
    });

    it('rankings e categorias devolvem listas com os campos do contrato', async () => {
      const periodo = `dataInicio=${somarDias(hoje, -30)}&dataFim=${hoje}`;
      const categorias = await api('GET', `/api/relatorios/vendas-por-categoria?${periodo}`);
      const produtos = await api('GET', `/api/relatorios/produtos-mais-vendidos?${periodo}&limite=3`);
      const clientes = await api('GET', `/api/relatorios/melhores-clientes?${periodo}&limite=3`);
      for (const resposta of [categorias, produtos, clientes]) esperarSucesso(resposta);
      expect(produtos.corpo.length).toBeLessThanOrEqual(3);
      expect(clientes.corpo.length).toBeLessThanOrEqual(3);
      categorias.corpo.forEach((c) => expect(c).toMatchObject({ nome: expect.any(String), valor: expect.any(Number) }));
      produtos.corpo.forEach((p) => expect(p).toMatchObject({ nome: expect.any(String), vendas: expect.any(Number), receita: expect.any(Number) }));
      clientes.corpo.forEach((c) => expect(c).toMatchObject({ nome: expect.any(String), total: expect.any(Number), compras: expect.any(Number) }));
    });
  });

  describe('9. Configurações', () => {
    it('PUT salva e devolve as configurações; modelo inválido é recusado', async () => {
      const atuais = (await api('GET', '/api/configuracoes')).corpo;
      const alteradas = { ...atuais, impressao: { ...atuais.impressao, mensagemRodape: `Contrato ${sufixo}` } };
      const resposta = await api('PUT', '/api/configuracoes', alteradas);
      esperarSucesso(resposta);
      expect(resposta.corpo.impressao.mensagemRodape).toBe(`Contrato ${sufixo}`);
      expect((await api('GET', '/api/configuracoes')).corpo.impressao.mensagemRodape).toBe(`Contrato ${sufixo}`);
      esperarErro(await api('PUT', '/api/configuracoes', { ...atuais, impressao: { ...atuais.impressao, modelo: 'Matricial' } }), 400);
      esperarSucesso(await api('PUT', '/api/configuracoes', atuais));
    });
  });

  describe('Limpeza', () => {
    it('exclui o cliente e o produto criados pelo teste', async () => {
      esperarSucesso(await api('DELETE', `/api/clientes/${cliente.id}`));
      esperarSucesso(await api('DELETE', `/api/produtos/${produto.id}`));
      expect((await api('GET', `/api/produtos?busca=ct${sufixo}`)).corpo).toEqual([]);
      esperarErro(await api('DELETE', `/api/produtos/${produto.id}`), 404);
    });
  });
});
