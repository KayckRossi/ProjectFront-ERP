// Testes do CONTRATO_API_BACKEND.md.
//
// Sem variáveis de ambiente, rodam contra o servidor de demonstração (implementação de referência).
// Para validar o backend real (use um banco de testes, pois os testes criam registros):
//   CONTRATO_API_URL=http://localhost:3000 CONTRATO_EMAIL=admin@empresa.com CONTRATO_SENHA=segredo npm run test:contrato
// Opcional, para testar as permissões com um usuário de perfil "operador":
//   CONTRATO_EMAIL_OPERADOR=caixa@empresa.com CONTRATO_SENHA_OPERADOR=segredo
import { beforeAll, describe, expect, it } from 'vitest';
import { criarServidorDemo } from './demo/servidor.js';
import { dataLocalISO, somarDias } from '../lib/datas.js';

const URL_BACKEND = (process.env.CONTRATO_API_URL || '').replace(/\/+$/, '');
const contraBackendReal = Boolean(URL_BACKEND);

const ADMIN = contraBackendReal
  ? { email: process.env.CONTRATO_EMAIL, senha: process.env.CONTRATO_SENHA }
  : { email: 'admin@nexora.com', senha: 'admin123' };
const OPERADOR = contraBackendReal
  ? process.env.CONTRATO_EMAIL_OPERADOR && { email: process.env.CONTRATO_EMAIL_OPERADOR, senha: process.env.CONTRATO_SENHA_OPERADOR }
  : { email: 'operador@nexora.com', senha: 'operador123' };

// Devolve uma função (método, caminho, body) => { status, corpo } autenticada como administrador
async function criarClienteApi() {
  let requisitar;
  if (contraBackendReal) {
    requisitar = async (metodo, caminho, body, token) => {
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
  } else {
    const memoria = new Map();
    const storage = {
      getItem: (chave) => memoria.get(chave) ?? null,
      setItem: (chave, valor) => memoria.set(chave, valor),
      removeItem: (chave) => memoria.delete(chave),
    };
    const servidor = criarServidorDemo({ storage });
    requisitar = async (metodo, caminho, body, token) => servidor.responder(metodo, caminho, body, token);
  }

  const entrar = async ({ email, senha }) => {
    const login = await requisitar('POST', '/api/auth/login', { email, password: senha });
    if (login.status !== 200 || !login.corpo?.access_token) {
      throw new Error(`Login de ${email} falhou (status ${login.status}). Confira as credenciais usadas nos testes.`);
    }
    return login.corpo.access_token;
  };
  const comToken = (token) => (metodo, caminho, body) => requisitar(metodo, caminho, body, token);

  const api = comToken(await entrar(ADMIN));
  api.semToken = comToken(null);
  api.comoUsuario = async (credenciais) => comToken(await entrar(credenciais));
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
let eu;
let categoria;
let produto;
let cliente;
let venda;
let caixa;
let abriuCaixa = false;
let fornecedor;
let compra;

const estoqueDoProduto = async () => (await api('GET', `/api/produtos?busca=ct${sufixo}`)).corpo.find((p) => p.id === produto.id);

beforeAll(async () => {
  api = await criarClienteApi();
});

describe(`Contrato da API (${contraBackendReal ? URL_BACKEND : 'servidor de demonstração'})`, () => {
  describe('1. Autenticação', () => {
    it('login com senha errada responde 401 com mensagem', async () => {
      esperarErro(await api.semToken('POST', '/api/auth/login', { email: ADMIN.email, password: `errada-${sufixo}` }), 401);
    });

    it('rotas autenticadas exigem token (401) e /me devolve o usuário com o perfil', async () => {
      esperarErro(await api.semToken('GET', '/api/produtos'), 401);
      esperarErro(await api.semToken('GET', '/api/auth/me'), 401);
      const resposta = await api('GET', '/api/auth/me');
      esperarSucesso(resposta);
      eu = resposta.corpo;
      expect(eu).toMatchObject({ id: expect.anything(), email: expect.any(String), nome: expect.any(String), role: 'admin' });
    });
  });

  describe.runIf(Boolean(OPERADOR))('10. Perfis e permissões', () => {
    it('operador acessa o que precisa para vender e recebe 403 no restante', async () => {
      const operador = await api.comoUsuario(OPERADOR);
      expect((await operador('GET', '/api/auth/me')).corpo.role).toBe('operador');
      esperarSucesso(await operador('GET', '/api/produtos'));
      esperarSucesso(await operador('GET', '/api/clientes'));
      esperarSucesso(await operador('GET', '/api/configuracoes'));
      esperarErro(await operador('GET', '/api/usuarios'), 403);
      esperarErro(await operador('GET', '/api/financeiro/transacoes'), 403);
      esperarErro(await operador('GET', '/api/dashboard/kpis'), 403);
      esperarErro(await operador('GET', '/api/caixa/sessoes'), 403);
      esperarErro(await operador('GET', '/api/auditoria'), 403);
      esperarErro(await operador('POST', '/api/produtos', { nome: 'X', preco: 1, categoria: 'x' }), 403);
      esperarErro(await operador('PUT', '/api/configuracoes', {}), 403);
      // A permissão é verificada antes da existência do registro
      esperarErro(await operador('POST', `/api/vendas/nao-existe-${sufixo}/cancelar`, {}), 403);
      esperarErro(await operador('DELETE', `/api/clientes/nao-existe-${sufixo}`), 403);
    });
  });

  describe('2. Categorias e produtos', () => {
    it('cria categoria (201) e recusa nome repetido (409) e cor inválida (400)', async () => {
      const resposta = await api('POST', '/api/categorias', { nome: `Categoria ${sufixo}`, cor: '#4a90d9' });
      esperarSucesso(resposta, 201);
      categoria = resposta.corpo;
      expect(categoria).toMatchObject({ id: expect.any(String), nome: `Categoria ${sufixo}`, cor: '#4A90D9' });
      esperarErro(await api('POST', '/api/categorias', { nome: `categoria ${sufixo}`, cor: '#000000' }), 409);
      esperarErro(await api('POST', '/api/categorias', { nome: `Outra ${sufixo}`, cor: 'azul' }), 400);
      const lista = await api('GET', '/api/categorias');
      expect(lista.corpo.map((c) => c.id)).toContain(categoria.id);
    });

    it('PUT atualiza a categoria', async () => {
      const resposta = await api('PUT', `/api/categorias/${categoria.id}`, { nome: `Categoria ${sufixo} editada`, cor: '#8E7DBE' });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: categoria.id, nome: `Categoria ${sufixo} editada`, cor: '#8E7DBE' });
      categoria = resposta.corpo;
    });

    it('recusa produto inválido com 400', async () => {
      const base = { nome: 'Inválido', categoria: categoria.id, custo: 2, estoque: 1, estoqueMinimo: 0 };
      esperarErro(await api('POST', '/api/produtos', { ...base, preco: 0 }), 400);
      esperarErro(await api('POST', '/api/produtos', { ...base, preco: 1 }), 400); // abaixo do custo
      esperarErro(await api('POST', '/api/produtos', { ...base, nome: '', preco: 5 }), 400);
      esperarErro(await api('POST', '/api/produtos', { ...base, categoria: `nao-existe-${sufixo}`, preco: 5 }), 400);
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

    it('recusa SKU duplicado (409) e não exclui categoria com produtos (409)', async () => {
      esperarErro(await api('POST', '/api/produtos', {
        nome: 'Duplicado', sku: `CT${sufixo}`, categoria: categoria.id, custo: 1, preco: 2, estoque: 0, estoqueMinimo: 0,
      }), 409);
      esperarErro(await api('DELETE', `/api/categorias/${categoria.id}`), 409);
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

  describe('5, 6 e 12. Caixa, vendas e pedidos', () => {
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

    it('sem caixa aberto (e com a regra ligada) a venda é recusada com 409', async () => {
      const atual = await api('GET', '/api/caixa/atual');
      const configuracoes = (await api('GET', '/api/configuracoes')).corpo;
      if (atual.status === 200) {
        caixa = atual.corpo; // o usuário de teste já tinha um caixa aberto: reaproveita e não fecha no final
        return;
      }
      expect(atual.status).toBe(204);
      if (configuracoes.pdv?.exigirCaixaAberto !== false) esperarErro(await api('POST', '/api/vendas', novaVenda()), 409);
    });

    it('abre o caixa (201) e não permite abrir outro (409)', async () => {
      if (!caixa) {
        const resposta = await api('POST', '/api/caixa/abrir', { valorInicial: 100 });
        esperarSucesso(resposta, 201);
        caixa = resposta.corpo;
        abriuCaixa = true;
        expect(caixa).toMatchObject({ id: expect.anything(), numero: expect.any(Number), status: 'aberta', valorInicial: 100, usuarioId: eu.id });
        expect(caixa.resumo).toMatchObject({ quantidadeVendas: 0, esperadoEmDinheiro: 100, diferenca: null });
      }
      esperarErro(await api('POST', '/api/caixa/abrir', { valorInicial: 50 }), 409);
      const atual = await api('GET', '/api/caixa/atual');
      esperarSucesso(atual);
      expect(atual.corpo.id).toBe(caixa.id);
    });

    it('recusa venda acima do estoque (409), total divergente (400) e dinheiro insuficiente (400)', async () => {
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), itens: [{ produtoId: produto.id, quantidade: 999, precoUnitario: 6 }], subtotal: undefined, desconto: undefined, total: undefined }), 409);
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), total: 10 }), 400);
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), valorRecebido: 5 }), 400);
      esperarErro(await api('POST', '/api/vendas', { ...novaVenda(), itens: [] }), 400);
    });

    it('registra a venda (201), vinculada ao caixa e ao operador', async () => {
      const resposta = await api('POST', '/api/vendas', novaVenda());
      esperarSucesso(resposta, 201);
      venda = resposta.corpo;
      expect(venda).toMatchObject({
        id: expect.anything(),
        numero: expect.any(Number),
        pedidoId: expect.anything(),
        caixaId: caixa.id,
        usuarioId: eu.id,
        operador: eu.nome,
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

    it('a venda baixa o estoque, soma ao cliente e entra no caixa', async () => {
      expect((await estoqueDoProduto()).estoque).toBe(12);
      const clientes = await api('GET', `/api/clientes?busca=${encodeURIComponent(cliente.email)}`);
      expect(clientes.corpo.find((c) => c.id === cliente.id).totalCompras).toBe(16.2);
      const atual = (await api('GET', '/api/caixa/atual')).corpo;
      expect(atual.resumo.porFormaPagamento.dinheiro).toBeCloseTo(caixa.resumo.porFormaPagamento.dinheiro + 16.2, 2);
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
      expect(resposta.corpo).toMatchObject({ id: venda.id, status: 'Cancelada', motivoCancelamento: 'Teste de contrato', canceladaPor: eu.nome });

      expect((await estoqueDoProduto()).estoque).toBe(15);
      const clientes = await api('GET', `/api/clientes?busca=${encodeURIComponent(cliente.email)}`);
      expect(clientes.corpo.find((c) => c.id === cliente.id).totalCompras).toBe(0);
      const pedidos = await api('GET', '/api/pedidos');
      expect(pedidos.corpo.map((p) => p.id)).not.toContain(venda.pedidoId);
      const transacoes = await api('GET', `/api/financeiro/transacoes?dataInicio=${hoje}&dataFim=${hoje}&tipo=saida`);
      expect(transacoes.corpo).toContainEqual(expect.objectContaining({ tipo: 'saida', valor: 16.2, categoria: 'Estornos' }));

      esperarErro(await api('POST', `/api/vendas/${venda.id}/cancelar`, {}), 409);
    });

    it('suprimento e sangria alteram o dinheiro esperado; sangria acima do caixa é recusada (409)', async () => {
      const antes = (await api('GET', '/api/caixa/atual')).corpo.resumo.esperadoEmDinheiro;
      const suprimento = await api('POST', '/api/caixa/movimentos', { tipo: 'suprimento', valor: 50, motivo: 'Troco extra' });
      esperarSucesso(suprimento, 201);
      expect(suprimento.corpo.resumo.esperadoEmDinheiro).toBeCloseTo(antes + 50, 2);
      esperarErro(await api('POST', '/api/caixa/movimentos', { tipo: 'sangria', valor: antes + 1000 }), 409);
      esperarErro(await api('POST', '/api/caixa/movimentos', { tipo: 'retirada', valor: 10 }), 400);
      const sangria = await api('POST', '/api/caixa/movimentos', { tipo: 'sangria', valor: 20, motivo: 'Cofre' });
      esperarSucesso(sangria, 201);
      expect(sangria.corpo.resumo).toMatchObject({ esperadoEmDinheiro: expect.closeTo(antes + 30, 2) });
    });

    it('fechamento calcula a diferença e encerra o caixa', async (ctx) => {
      // Só fecha um caixa aberto pelo próprio teste
      if (!abriuCaixa) return ctx.skip();
      // A venda cancelada não entra: esperado = 100 (fundo) + 50 (suprimento) - 20 (sangria)
      const atual = (await api('GET', '/api/caixa/atual')).corpo;
      expect(atual.resumo).toMatchObject({ esperadoEmDinheiro: 130, vendasCanceladas: 1 });
      esperarErro(await api('POST', '/api/caixa/fechar', {}), 400);
      const resposta = await api('POST', '/api/caixa/fechar', { valorContado: 128, observacoes: 'Faltaram R$ 2' });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: caixa.id, status: 'fechada', valorContado: 128, observacoes: 'Faltaram R$ 2' });
      expect(resposta.corpo.resumo).toMatchObject({ esperadoEmDinheiro: 130, diferenca: -2 });
      expect((await api('GET', '/api/caixa/atual')).status).toBe(204);
      esperarErro(await api('POST', '/api/caixa/fechar', { valorContado: 0 }), 409);
      const historico = await api('GET', `/api/caixa/sessoes?dataInicio=${hoje}&dataFim=${hoje}`);
      expect(historico.corpo.find((s) => s.id === caixa.id)).toMatchObject({ status: 'fechada', movimentos: expect.any(Array) });
      esperarSucesso(await api('GET', `/api/caixa/sessoes/${caixa.id}`));
    });
  });

  describe('13 e 14. Fornecedores e compras', () => {
    const cnpj = `${sufixo}0001`.padStart(14, '9').slice(0, 14);
    const cnpjFormatado = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;

    it('cadastra fornecedor (201) e recusa dados inválidos (400) ou CNPJ repetido (409)', async () => {
      esperarErro(await api('POST', '/api/fornecedores', { razaoSocial: '' }), 400);
      esperarErro(await api('POST', '/api/fornecedores', { razaoSocial: 'X', cnpj: '123' }), 400);
      esperarErro(await api('POST', '/api/fornecedores', { razaoSocial: 'X', prazoPagamentoDias: -1 }), 400);
      const resposta = await api('POST', '/api/fornecedores', {
        razaoSocial: `Fornecedor Contrato ${sufixo} LTDA`, nomeFantasia: `Fornecedor ${sufixo}`, cnpj: cnpjFormatado, prazoPagamentoDias: 21,
      });
      esperarSucesso(resposta, 201);
      fornecedor = resposta.corpo;
      expect(fornecedor).toMatchObject({ id: expect.anything(), cnpj: cnpjFormatado, prazoPagamentoDias: 21 });
      esperarErro(await api('POST', '/api/fornecedores', { razaoSocial: 'Outro', cnpj: cnpjFormatado }), 409);
    });

    it('PUT atualiza o fornecedor e a busca encontra pelo CNPJ', async () => {
      const resposta = await api('PUT', `/api/fornecedores/${fornecedor.id}`, { ...fornecedor, contato: 'Contato Teste' });
      esperarSucesso(resposta);
      expect(resposta.corpo.contato).toBe('Contato Teste');
      const busca = await api('GET', `/api/fornecedores?busca=${cnpj}`);
      expect(busca.corpo.map((f) => f.id)).toContain(fornecedor.id);
    });

    it('recusa compra inválida (400) e cria compra aberta (201)', async () => {
      esperarErro(await api('POST', '/api/compras', { fornecedorId: fornecedor.id, itens: [] }), 400);
      esperarErro(await api('POST', '/api/compras', { fornecedorId: `nao-existe-${sufixo}`, itens: [{ produtoId: produto.id, quantidade: 1, custoUnitario: 1 }] }), 400);
      esperarErro(await api('POST', '/api/compras', { fornecedorId: fornecedor.id, itens: [{ produtoId: produto.id, quantidade: 1, custoUnitario: 0 }] }), 400);
      const resposta = await api('POST', '/api/compras', { fornecedorId: fornecedor.id, itens: [{ produtoId: produto.id, quantidade: 12, custoUnitario: 2.5 }] });
      esperarSucesso(resposta, 201);
      compra = resposta.corpo;
      expect(compra).toMatchObject({ id: expect.anything(), numero: expect.any(Number), status: 'aberta', total: 30, fornecedorId: fornecedor.id });
      expect((await estoqueDoProduto()).estoque).toBe(15); // compra aberta não mexe no estoque
    });

    it('PUT altera a compra aberta', async () => {
      const resposta = await api('PUT', `/api/compras/${compra.id}`, { fornecedorId: fornecedor.id, itens: [{ produtoId: produto.id, quantidade: 24, custoUnitario: 2.5 }] });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: compra.id, total: 60 });
    });

    it('receber soma ao estoque, atualiza o custo e lança a despesa; não pode receber de novo', async () => {
      const resposta = await api('POST', `/api/compras/${compra.id}/receber`, { atualizarCusto: true });
      esperarSucesso(resposta);
      expect(resposta.corpo).toMatchObject({ id: compra.id, status: 'recebida', vencimento: somarDias(hoje, 21) });
      const atualizado = await estoqueDoProduto();
      expect(atualizado).toMatchObject({ estoque: 39, custo: 2.5 });
      const transacoes = await api('GET', `/api/financeiro/transacoes?dataInicio=${hoje}&dataFim=${hoje}&tipo=saida`);
      expect(transacoes.corpo).toContainEqual(expect.objectContaining({ categoria: 'Fornecedores', valor: 60, compraId: compra.id }));
      esperarErro(await api('POST', `/api/compras/${compra.id}/receber`, {}), 409);
      esperarErro(await api('PUT', `/api/compras/${compra.id}`, { fornecedorId: fornecedor.id, itens: [{ produtoId: produto.id, quantidade: 1, custoUnitario: 1 }] }), 409);
    });

    it('cancela compra aberta e não exclui fornecedor com compras (409)', async () => {
      const outra = await api('POST', '/api/compras', { fornecedorId: fornecedor.id, itens: [{ produtoId: produto.id, quantidade: 6, custoUnitario: 2.5 }] });
      const cancelada = await api('POST', `/api/compras/${outra.corpo.id}/cancelar`, { motivo: 'Teste' });
      esperarSucesso(cancelada);
      expect(cancelada.corpo).toMatchObject({ status: 'cancelada', motivoCancelamento: 'Teste' });
      esperarErro(await api('POST', `/api/compras/${outra.corpo.id}/cancelar`, {}), 409);
      esperarErro(await api('DELETE', `/api/fornecedores/${fornecedor.id}`), 409);
      const lista = await api('GET', `/api/compras?fornecedorId=${fornecedor.id}`);
      expect(lista.corpo.map((c) => c.status).sort()).toEqual(['cancelada', 'recebida']);
    });
  });

  describe('11. Usuários', () => {
    let usuario;
    const email = `usuario${sufixo}@teste.com`;

    it('cria usuário (201) e recusa e-mail repetido (409) ou perfil inválido (400)', async () => {
      const resposta = await api('POST', '/api/usuarios', { nome: `Usuário ${sufixo}`, email, role: 'operador' });
      esperarSucesso(resposta, 201);
      usuario = resposta.corpo;
      expect(usuario).toMatchObject({ id: expect.anything(), email, role: 'operador', ativo: true });
      expect(usuario).not.toHaveProperty('senha');
      esperarErro(await api('POST', '/api/usuarios', { nome: 'Outro', email, role: 'operador' }), 409);
      esperarErro(await api('POST', '/api/usuarios', { nome: 'Outro', email: `outro${sufixo}@teste.com`, role: 'dono' }), 400);
      expect((await api('GET', '/api/usuarios')).corpo.map((u) => u.id)).toContain(usuario.id);
    });

    it('altera perfil, desativa e envia redefinição de senha', async () => {
      const gerente = await api('PUT', `/api/usuarios/${usuario.id}`, { nome: usuario.nome, email, role: 'gerente', ativo: true });
      esperarSucesso(gerente);
      expect(gerente.corpo.role).toBe('gerente');
      esperarSucesso(await api('POST', `/api/usuarios/${usuario.id}/redefinir-senha`));
      const desativado = await api('PUT', `/api/usuarios/${usuario.id}`, { nome: usuario.nome, email, role: 'gerente', ativo: false });
      expect(desativado.corpo.ativo).toBe(false);
    });

    it.runIf(!contraBackendReal)('usuário desativado não consegue entrar (403)', async () => {
      esperarErro(await api.semToken('POST', '/api/auth/login', { email, password: 'nexora123' }), 403);
    });

    it('não permite desativar a si mesmo nem mudar o próprio perfil (409)', async () => {
      esperarErro(await api('PUT', `/api/usuarios/${eu.id}`, { nome: eu.nome, email: eu.email, role: 'admin', ativo: false }), 409);
      esperarErro(await api('PUT', `/api/usuarios/${eu.id}`, { nome: eu.nome, email: eu.email, role: 'gerente', ativo: true }), 409);
    });
  });

  describe('7. Financeiro', () => {
    it('lança movimentação manual (201) e recusa categoria inválida (400)', async () => {
      const dados = { descricao: `Despesa contrato ${sufixo}`, tipo: 'saida', valor: 12.34, categoria: 'Outros', data: hoje };
      const resposta = await api('POST', '/api/financeiro/transacoes', dados);
      esperarSucesso(resposta, 201);
      expect(resposta.corpo).toMatchObject({ id: expect.anything(), ...dados });
      esperarErro(await api('POST', '/api/financeiro/transacoes', { ...dados, categoria: 'Vendas' }), 400);
      esperarErro(await api('POST', '/api/financeiro/transacoes', { ...dados, categoria: 'Estornos' }), 400);
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
      expect(typeof atuais.pdv?.exigirCaixaAberto).toBe('boolean');
      const alteradas = { ...atuais, impressao: { ...atuais.impressao, mensagemRodape: `Contrato ${sufixo}` } };
      const resposta = await api('PUT', '/api/configuracoes', alteradas);
      esperarSucesso(resposta);
      expect(resposta.corpo.impressao.mensagemRodape).toBe(`Contrato ${sufixo}`);
      expect((await api('GET', '/api/configuracoes')).corpo.impressao.mensagemRodape).toBe(`Contrato ${sufixo}`);
      esperarErro(await api('PUT', '/api/configuracoes', { ...atuais, impressao: { ...atuais.impressao, modelo: 'Matricial' } }), 400);
      esperarSucesso(await api('PUT', '/api/configuracoes', atuais));
    });
  });

  describe('15. Auditoria', () => {
    it('registra quem fez cada ação e permite filtrar por área', async () => {
      const resposta = await api('GET', `/api/auditoria?dataInicio=${hoje}&dataFim=${hoje}`);
      esperarSucesso(resposta);
      expect(resposta.corpo).toContainEqual(expect.objectContaining({ entidade: 'venda', entidadeId: venda.id, acao: 'registrou', usuarioId: eu.id, usuario: eu.nome }));
      expect(resposta.corpo).toContainEqual(expect.objectContaining({ entidade: 'venda', entidadeId: venda.id, acao: 'cancelou' }));
      expect(resposta.corpo).toContainEqual(expect.objectContaining({ entidade: 'compra', entidadeId: compra.id, acao: 'recebeu' }));
      resposta.corpo.forEach((r) => expect(r).toMatchObject({ id: expect.anything(), data: expect.any(String), descricao: expect.any(String) }));
      const caixas = await api('GET', `/api/auditoria?dataInicio=${hoje}&dataFim=${hoje}&entidade=caixa`);
      expect(caixas.corpo.length).toBeGreaterThan(0);
      expect(caixas.corpo.every((r) => r.entidade === 'caixa')).toBe(true);
      esperarErro(await api('GET', '/api/auditoria?entidade=planeta'), 400);
    });
  });

  describe('Limpeza', () => {
    it('exclui cliente, produto e categoria criados pelo teste', async () => {
      esperarSucesso(await api('DELETE', `/api/clientes/${cliente.id}`));
      esperarSucesso(await api('DELETE', `/api/produtos/${produto.id}`));
      esperarSucesso(await api('DELETE', `/api/categorias/${categoria.id}`));
      expect((await api('GET', `/api/produtos?busca=ct${sufixo}`)).corpo).toEqual([]);
      esperarErro(await api('DELETE', `/api/produtos/${produto.id}`), 404);
    });
  });
});
