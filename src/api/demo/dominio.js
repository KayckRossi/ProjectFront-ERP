// Regras de negócio do Nexora, escritas como implementação de referência do CONTRATO_API_BACKEND.md.
// O servidor de demonstração e os testes de contrato usam este módulo; o backend real deve se comportar igual.
// Usa apenas imports relativos para rodar também fora do Vite (Node puro e testes).
import { statusEstoque } from '../../lib/estoque.js';
import { arredondar, calcularTotais } from '../../lib/dinheiro.js';
import { dataLocalISO, dataISOValida, diferencaEmDias, nomeMesAbreviado, somarDias } from '../../lib/datas.js';
import { normalizarTexto, somenteDigitos } from '../../lib/texto.js';
import { EMAIL_VALIDO } from '../../lib/mascaras.js';

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const falhar = (status, mensagem) => {
  throw new ErroApi(status, mensagem);
};

export const FORMAS_PAGAMENTO = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };
export const STATUS_VENDA = ['Concluída', 'Cancelada'];
export const STATUS_PEDIDO = ['pendente', 'em_preparo', 'finalizado'];
// Categorias aceitas no lançamento manual; "Estornos" é usada apenas pelo cancelamento de vendas
export const CATEGORIAS_TRANSACAO = {
  entrada: ['Vendas', 'Serviços', 'Outros'],
  saida: ['Fornecedores', 'Fixos', 'Pessoal', 'Impostos', 'Outros'],
};
export const MODELOS_IMPRESSAO = ['Térmica 80mm', 'Térmica 58mm', 'A4'];
export const LIMITE_PERIODO_DIAS = 366;

const texto = (valor) => String(valor ?? '').trim();
const proximo = (db, sequencia) => (db.sequencias[sequencia] += 1);
const dataDaVenda = (venda) => dataLocalISO(new Date(venda.data));
const maisRecentePrimeiro = (a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0);
const numeroDoId = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

function inteiroLimitado(valor, padrao, minimo, maximo) {
  const numero = parseInt(valor, 10);
  return Number.isFinite(numero) ? Math.min(maximo, Math.max(minimo, numero)) : padrao;
}

// Período "dataInicio"/"dataFim" (AAAA-MM-DD, inclusive). Sem parâmetros, usa os últimos `diasPadrao` dias.
function lerPeriodo(query, hoje, diasPadrao) {
  const dataFim = query.dataFim || hoje;
  const dataInicio = query.dataInicio || somarDias(dataFim, -(diasPadrao - 1));
  if (!dataISOValida(dataInicio) || !dataISOValida(dataFim)) falhar(400, 'As datas devem estar no formato AAAA-MM-DD.');
  if (dataInicio > dataFim) falhar(400, 'A data inicial deve ser anterior ou igual à data final.');
  if (diferencaEmDias(dataInicio, dataFim) >= LIMITE_PERIODO_DIAS) falhar(400, `O período máximo é de ${LIMITE_PERIODO_DIAS} dias.`);
  return { dataInicio, dataFim };
}

const noPeriodo = (dataISO, { dataInicio, dataFim }) => dataISO >= dataInicio && dataISO <= dataFim;

// ---------------------------------------------------------------- Categorias e produtos

export const listarCategorias = (db) => db.categorias;

export function listarProdutos(db, query = {}) {
  let lista = db.produtos;
  if (query.categoria) lista = lista.filter((p) => p.categoria === query.categoria);
  if (query.busca) {
    const termo = normalizarTexto(query.busca);
    lista = lista.filter((p) => normalizarTexto(p.nome).includes(termo) || normalizarTexto(p.sku).includes(termo));
  }
  if (query.codigoBarras) {
    const codigo = texto(query.codigoBarras);
    lista = lista.filter((p) => p.codigoBarras === codigo || (p.sku && p.sku === codigo.toUpperCase()));
  }
  return lista;
}

const encontrarProduto = (db, id) => db.produtos.find((p) => p.id === id) ?? falhar(404, 'Produto não encontrado.');

function digitoVerificadorEan(base12) {
  const soma = [...base12].reduce((total, digito, i) => total + Number(digito) * (i % 2 === 0 ? 1 : 3), 0);
  return String((10 - (soma % 10)) % 10);
}

// EAN-13 com prefixo 789 (GS1 Brasil) para produtos cadastrados sem código de barras
function gerarCodigoBarras(db) {
  let sequencial = db.produtos.length;
  let codigo;
  do {
    sequencial += 1;
    const base = `789${String(sequencial).padStart(9, '0')}`;
    codigo = base + digitoVerificadorEan(base);
  } while (db.produtos.some((p) => p.codigoBarras === codigo));
  return codigo;
}

function validarProduto(db, dados, idAtual) {
  const nome = texto(dados?.nome);
  if (!nome) falhar(400, 'Informe o nome do produto.');
  const preco = Number(dados.preco);
  const custo = Number(dados.custo ?? 0);
  if (!(preco > 0)) falhar(400, 'O preço de venda deve ser maior que zero.');
  if (!(custo >= 0)) falhar(400, 'O preço de custo não pode ser negativo.');
  if (preco < custo) falhar(400, 'O preço de venda está abaixo do custo.');
  const estoque = Number(dados.estoque ?? 0);
  const estoqueMinimo = Number(dados.estoqueMinimo ?? 0);
  if (![estoque, estoqueMinimo].every((n) => Number.isInteger(n) && n >= 0)) {
    falhar(400, 'Estoque e estoque mínimo devem ser números inteiros maiores ou iguais a zero.');
  }
  if (!db.categorias.some((c) => c.id === dados.categoria)) falhar(400, 'Categoria inválida.');
  const sku = texto(dados.sku).toUpperCase();
  if (sku && db.produtos.some((p) => p.id !== idAtual && p.sku === sku)) falhar(409, `O SKU ${sku} já está em uso por outro produto.`);
  const codigoBarras = texto(dados.codigoBarras);
  if (codigoBarras && db.produtos.some((p) => p.id !== idAtual && p.codigoBarras === codigoBarras)) {
    falhar(409, 'Este código de barras já pertence a outro produto.');
  }
  return {
    nome,
    sku,
    categoria: dados.categoria,
    custo: arredondar(custo),
    preco: arredondar(preco),
    estoque,
    estoqueMinimo,
    ...(codigoBarras && { codigoBarras }),
  };
}

export function criarProduto(db, dados) {
  const validado = validarProduto(db, dados);
  const produto = { id: `p${proximo(db, 'produto')}`, ...validado };
  produto.codigoBarras ??= gerarCodigoBarras(db);
  db.produtos.push(produto);
  return produto;
}

export function atualizarProduto(db, id, dados) {
  const produto = encontrarProduto(db, id);
  // codigoBarras ausente mantém o atual
  Object.assign(produto, validarProduto(db, dados, id));
  return produto;
}

export function excluirProduto(db, id) {
  encontrarProduto(db, id);
  db.produtos = db.produtos.filter((p) => p.id !== id);
  return { sucesso: true, mensagem: 'Produto removido com sucesso' };
}

// ---------------------------------------------------------------- Estoque

const visaoEstoque = (p) => ({
  id: p.id,
  nome: p.nome,
  sku: p.sku,
  categoria: p.categoria,
  estoque: p.estoque,
  estoqueMinimo: p.estoqueMinimo,
  status: statusEstoque(p),
});

export function listarEstoque(db, query = {}) {
  let lista = db.produtos.map(visaoEstoque);
  if (query.filtro === 'baixo') lista = lista.filter((p) => p.estoque > 0 && p.status !== 'OK');
  else if (query.filtro === 'sem-estoque') lista = lista.filter((p) => p.estoque === 0);
  else if (query.filtro) falhar(400, 'Filtro inválido. Use "baixo" ou "sem-estoque".');
  if (query.busca) {
    const termo = normalizarTexto(query.busca);
    lista = lista.filter((p) => normalizarTexto(p.nome).includes(termo) || normalizarTexto(p.sku).includes(termo));
  }
  return lista;
}

export function movimentarEstoque(db, dados) {
  const produto = db.produtos.find((p) => p.id === dados?.produtoId) ?? falhar(404, 'Produto não encontrado.');
  if (!['entrada', 'saida'].includes(dados.tipo)) falhar(400, 'Tipo de movimentação inválido. Use "entrada" ou "saida".');
  const quantidade = Number(dados.quantidade);
  if (!Number.isInteger(quantidade) || quantidade <= 0) falhar(400, 'A quantidade deve ser um número inteiro maior que zero.');
  if (dados.tipo === 'saida' && quantidade > produto.estoque) {
    falhar(409, `A saída (${quantidade}) é maior que o estoque atual de ${produto.nome} (${produto.estoque}).`);
  }
  produto.estoque += dados.tipo === 'entrada' ? quantidade : -quantidade;
  return visaoEstoque(produto);
}

// ---------------------------------------------------------------- Clientes

const encontrarCliente = (db, id) => db.clientes.find((c) => c.id === id) ?? falhar(404, 'Cliente não encontrado.');

function validarCliente(db, dados, idAtual) {
  const nome = texto(dados?.nome);
  if (!nome) falhar(400, 'Informe o nome ou razão social.');
  const documento = texto(dados.documento);
  const digitosDocumento = somenteDigitos(documento);
  if (digitosDocumento && digitosDocumento.length !== 11 && digitosDocumento.length !== 14) {
    falhar(400, 'CPF deve ter 11 dígitos e CNPJ 14.');
  }
  if (digitosDocumento && db.clientes.some((c) => c.id !== idAtual && somenteDigitos(c.documento) === digitosDocumento)) {
    falhar(409, 'Já existe um cliente cadastrado com este documento.');
  }
  const telefone = texto(dados.telefone);
  const digitosTelefone = somenteDigitos(telefone);
  if (digitosTelefone && (digitosTelefone.length < 10 || digitosTelefone.length > 11)) {
    falhar(400, 'Telefone deve ter DDD e 8 ou 9 dígitos.');
  }
  const email = texto(dados.email);
  if (email && !EMAIL_VALIDO.test(email)) falhar(400, 'E-mail inválido.');
  return { nome, documento, telefone, email };
}

export function listarClientes(db, query = {}) {
  if (!query.busca) return db.clientes;
  const termo = normalizarTexto(query.busca);
  const digitos = somenteDigitos(query.busca);
  return db.clientes.filter(
    (c) =>
      normalizarTexto(c.nome).includes(termo) ||
      normalizarTexto(c.email).includes(termo) ||
      (digitos && somenteDigitos(c.documento).includes(digitos)),
  );
}

export function criarCliente(db, dados) {
  const validado = validarCliente(db, dados);
  const cliente = { id: `c${proximo(db, 'cliente')}`, ...validado, totalCompras: 0 };
  db.clientes.push(cliente);
  return cliente;
}

export function atualizarCliente(db, id, dados) {
  const cliente = encontrarCliente(db, id);
  Object.assign(cliente, validarCliente(db, dados, id));
  return cliente;
}

export function excluirCliente(db, id) {
  encontrarCliente(db, id);
  db.clientes = db.clientes.filter((c) => c.id !== id);
  return { sucesso: true, mensagem: 'Cliente removido com sucesso' };
}

// ---------------------------------------------------------------- Financeiro

function lancarTransacao(db, { descricao, tipo, valor, data, categoria, vendaId }) {
  const transacao = { id: `t${proximo(db, 'transacao')}`, descricao, tipo, valor, data, categoria, ...(vendaId && { vendaId }) };
  db.transacoes.push(transacao);
  return transacao;
}

export function criarTransacao(db, dados) {
  const descricao = texto(dados?.descricao);
  if (!descricao) falhar(400, 'Informe a descrição da movimentação.');
  if (!CATEGORIAS_TRANSACAO[dados.tipo]) falhar(400, 'Tipo inválido. Use "entrada" ou "saida".');
  if (!(Number(dados.valor) > 0)) falhar(400, 'O valor deve ser maior que zero.');
  if (!CATEGORIAS_TRANSACAO[dados.tipo].includes(dados.categoria)) {
    falhar(400, `Categoria inválida para ${dados.tipo === 'entrada' ? 'entradas' : 'saídas'}.`);
  }
  if (!dataISOValida(dados.data)) falhar(400, 'A data deve estar no formato AAAA-MM-DD.');
  return lancarTransacao(db, {
    descricao,
    tipo: dados.tipo,
    valor: arredondar(dados.valor),
    data: dados.data,
    categoria: dados.categoria,
  });
}

export function listarTransacoes(db, query = {}, agora = new Date()) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), 30);
  if (query.tipo && !CATEGORIAS_TRANSACAO[query.tipo]) falhar(400, 'Tipo inválido. Use "entrada" ou "saida".');
  return db.transacoes
    .filter((t) => noPeriodo(t.data, periodo) && (!query.tipo || t.tipo === query.tipo))
    .sort((a, b) => b.data.localeCompare(a.data) || numeroDoId(b.id) - numeroDoId(a.id));
}

export function financeiroMensal(db, query = {}, agora = new Date()) {
  const meses = inteiroLimitado(query.meses, 6, 1, 24);
  const resultado = [];
  for (let i = meses - 1; i >= 0; i -= 1) {
    const referencia = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const anoMes = dataLocalISO(referencia).slice(0, 7);
    resultado.push({ anoMes, mes: nomeMesAbreviado(referencia.getMonth()), receitas: 0, despesas: 0 });
  }
  const porAnoMes = new Map(resultado.map((linha) => [linha.anoMes, linha]));
  for (const t of db.transacoes) {
    const linha = porAnoMes.get(t.data.slice(0, 7));
    if (linha) linha[t.tipo === 'entrada' ? 'receitas' : 'despesas'] += t.valor;
  }
  return resultado.map((linha) => ({ ...linha, receitas: arredondar(linha.receitas), despesas: arredondar(linha.despesas) }));
}

// ---------------------------------------------------------------- Vendas

const quantidadeDeItens = (itens) => itens.reduce((soma, item) => soma + item.quantidade, 0);

const resumoVenda = (v) => ({
  id: v.id,
  numero: v.numero,
  clienteId: v.clienteId,
  cliente: v.cliente,
  total: v.total,
  status: v.status,
  itens: quantidadeDeItens(v.itens),
  formaPagamento: v.formaPagamento,
  data: v.data,
});

export function registrarVenda(db, dados, agora = new Date()) {
  const itensEnviados = Array.isArray(dados?.itens) ? dados.itens : [];
  if (!itensEnviados.length) falhar(400, 'A venda precisa ter ao menos um item.');
  const { formaPagamento } = dados;
  if (!FORMAS_PAGAMENTO[formaPagamento]) falhar(400, 'Forma de pagamento inválida. Use "dinheiro", "cartao" ou "pix".');
  const descontoPercentual = Number(dados.descontoPercentual ?? 0);
  if (!Number.isFinite(descontoPercentual) || descontoPercentual < 0 || descontoPercentual > 100) {
    falhar(400, 'O desconto deve estar entre 0% e 100%.');
  }
  const cliente = dados.clienteId
    ? (db.clientes.find((c) => c.id === dados.clienteId) ?? falhar(400, 'O cliente informado não existe.'))
    : null;

  // Agrupa itens repetidos do mesmo produto
  const quantidades = new Map();
  for (const item of itensEnviados) {
    const quantidade = Number(item?.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1) falhar(400, 'A quantidade de cada item deve ser um inteiro maior que zero.');
    quantidades.set(item.produtoId, (quantidades.get(item.produtoId) ?? 0) + quantidade);
  }

  const produtosVendidos = [];
  const itens = [...quantidades].map(([produtoId, quantidade]) => {
    const produto = db.produtos.find((p) => p.id === produtoId) ?? falhar(400, `O produto ${produtoId} não existe.`);
    if (quantidade > produto.estoque) falhar(409, `Estoque insuficiente para ${produto.nome} (disponível: ${produto.estoque}).`);
    produtosVendidos.push([produto, quantidade]);
    return {
      produtoId,
      nome: produto.nome,
      categoria: produto.categoria,
      quantidade,
      precoUnitario: produto.preco,
      totalItem: arredondar(produto.preco * quantidade),
    };
  });

  // Os valores são sempre recalculados com os preços do cadastro
  const { subtotal, desconto, total } = calcularTotais(
    itens.map((i) => ({ preco: i.precoUnitario, quantidade: i.quantidade })),
    descontoPercentual,
  );
  if (dados.total != null && Math.abs(Number(dados.total) - total) >= 0.01) {
    falhar(
      400,
      `O total enviado (R$ ${Number(dados.total).toFixed(2)}) não confere com o calculado (R$ ${total.toFixed(2)}). Os preços podem ter mudado; atualize a tela.`,
    );
  }

  let valorRecebido = null;
  let troco = null;
  if (formaPagamento === 'dinheiro') {
    if (dados.valorRecebido == null) falhar(400, 'Informe o valor recebido em dinheiro.');
    valorRecebido = arredondar(dados.valorRecebido);
    if (!(valorRecebido >= total)) falhar(400, 'O valor recebido é menor que o total da venda.');
    troco = arredondar(valorRecebido - total);
  }

  // A partir daqui todas as validações passaram: aplica os efeitos da venda
  const numero = proximo(db, 'venda');
  const pedidoId = `ped-${proximo(db, 'pedido')}`;
  const data = agora.toISOString();
  const venda = {
    id: `v${numero}`,
    numero,
    pedidoId,
    clienteId: cliente?.id ?? null,
    cliente: cliente?.nome ?? 'Consumidor final',
    status: 'Concluída',
    formaPagamento,
    descontoPercentual,
    subtotal,
    desconto,
    total,
    valorRecebido,
    troco,
    itens,
    data,
  };

  for (const [produto, quantidade] of produtosVendidos) produto.estoque -= quantidade;
  if (cliente) cliente.totalCompras = arredondar((cliente.totalCompras ?? 0) + total);
  db.vendas.push(venda);
  db.pedidos.push({
    id: pedidoId,
    vendaId: venda.id,
    cliente: venda.cliente,
    total,
    status: 'pendente',
    itens: quantidadeDeItens(itens),
    pagamento: FORMAS_PAGAMENTO[formaPagamento],
    data,
    atualizadoEm: data,
  });
  if (total > 0) {
    lancarTransacao(db, { descricao: `Venda PDV #${numero}`, tipo: 'entrada', valor: total, data: dataLocalISO(agora), categoria: 'Vendas', vendaId: venda.id });
  }
  return venda;
}

export const obterVenda = (db, id) => db.vendas.find((v) => v.id === id) ?? falhar(404, 'Venda não encontrada.');

export function listarVendas(db, query = {}, agora = new Date()) {
  // Busca direta pelo número da venda: ignora período e demais filtros
  if (query.numero) {
    const numero = parseInt(query.numero, 10);
    return db.vendas.filter((v) => v.numero === numero).map(resumoVenda);
  }
  const periodo = lerPeriodo(query, dataLocalISO(agora), 30);
  if (query.status && !STATUS_VENDA.includes(query.status)) falhar(400, 'Status inválido. Use "Concluída" ou "Cancelada".');
  if (query.formaPagamento && !FORMAS_PAGAMENTO[query.formaPagamento]) falhar(400, 'Forma de pagamento inválida.');
  const termo = normalizarTexto(query.busca);
  const numeroBuscado = somenteDigitos(query.busca);
  return db.vendas
    .filter(
      (v) =>
        noPeriodo(dataDaVenda(v), periodo) &&
        (!query.status || v.status === query.status) &&
        (!query.formaPagamento || v.formaPagamento === query.formaPagamento) &&
        (!query.clienteId || v.clienteId === query.clienteId) &&
        (!termo || normalizarTexto(v.cliente).includes(termo) || (numeroBuscado && String(v.numero).includes(numeroBuscado))),
    )
    .sort(maisRecentePrimeiro)
    .map(resumoVenda);
}

export function vendasRecentes(db, query = {}) {
  const limite = inteiroLimitado(query.limite, 6, 1, 50);
  return [...db.vendas].sort(maisRecentePrimeiro).slice(0, limite).map(resumoVenda);
}

// Cancela a venda e desfaz seus efeitos: devolve o estoque, estorna o financeiro,
// abate o total do cliente e tira o pedido do Kanban.
export function cancelarVenda(db, id, dados = {}, agora = new Date()) {
  const venda = obterVenda(db, id);
  if (venda.status === 'Cancelada') falhar(409, 'Esta venda já foi cancelada.');
  venda.status = 'Cancelada';
  venda.canceladaEm = agora.toISOString();
  venda.motivoCancelamento = texto(dados?.motivo) || null;
  for (const item of venda.itens) {
    const produto = db.produtos.find((p) => p.id === item.produtoId);
    if (produto) produto.estoque += item.quantidade;
  }
  const cliente = venda.clienteId && db.clientes.find((c) => c.id === venda.clienteId);
  if (cliente) cliente.totalCompras = Math.max(0, arredondar(cliente.totalCompras - venda.total));
  const pedido = db.pedidos.find((p) => p.id === venda.pedidoId);
  if (pedido) {
    pedido.status = 'cancelado';
    pedido.atualizadoEm = venda.canceladaEm;
  }
  if (venda.total > 0) {
    lancarTransacao(db, {
      descricao: `Estorno da venda #${venda.numero}`,
      tipo: 'saida',
      valor: venda.total,
      data: dataLocalISO(agora),
      categoria: 'Estornos',
      vendaId: venda.id,
    });
  }
  return venda;
}

// ---------------------------------------------------------------- Pedidos (Kanban)

// Pedidos em aberto de qualquer data + finalizados nas últimas 24 horas
export function listarPedidos(db, agora = new Date()) {
  const limiteFinalizados = agora.getTime() - 24 * 60 * 60 * 1000;
  return db.pedidos
    .filter(
      (p) =>
        p.status !== 'cancelado' &&
        (p.status !== 'finalizado' || new Date(p.atualizadoEm ?? p.data).getTime() >= limiteFinalizados),
    )
    .sort(maisRecentePrimeiro);
}

export function atualizarStatusPedido(db, id, dados, agora = new Date()) {
  const pedido = db.pedidos.find((p) => p.id === id) ?? falhar(404, 'Pedido não encontrado.');
  if (!STATUS_PEDIDO.includes(dados?.status)) falhar(400, 'Status inválido. Use "pendente", "em_preparo" ou "finalizado".');
  if (pedido.status === 'cancelado') falhar(409, 'O pedido pertence a uma venda cancelada.');
  pedido.status = dados.status;
  pedido.atualizadoEm = agora.toISOString();
  return { id: pedido.id, status: pedido.status, mensagem: 'Status do pedido atualizado com sucesso' };
}

// ---------------------------------------------------------------- Dashboard e relatórios

const somar = (lista, campo) => lista.reduce((soma, item) => soma + item[campo], 0);

export function kpisDashboard(db, agora = new Date()) {
  const hoje = dataLocalISO(agora);
  const mesAtual = hoje.slice(0, 7);
  const concluidas = db.vendas.filter((v) => v.status === 'Concluída');
  const deHoje = concluidas.filter((v) => dataDaVenda(v) === hoje);
  const vendasHoje = arredondar(somar(deHoje, 'total'));
  return {
    vendasHoje,
    quantidadeVendasHoje: deHoje.length,
    ticketMedio: deHoje.length ? arredondar(vendasHoje / deHoje.length) : 0,
    produtosEmBaixa: db.produtos.filter((p) => statusEstoque(p) !== 'OK').length,
    faturamentoMensal: arredondar(somar(concluidas.filter((v) => dataDaVenda(v).startsWith(mesAtual)), 'total')),
  };
}

function vendasConcluidasNoPeriodo(db, query, agora, diasPadrao) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), diasPadrao);
  return db.vendas.filter((v) => v.status === 'Concluída' && noPeriodo(dataDaVenda(v), periodo));
}

// Rateia o desconto da venda entre os itens, para os totais por produto/categoria baterem com o faturamento
const fatorDesconto = (venda) => (venda.subtotal > 0 ? venda.total / venda.subtotal : 0);

export function vendasPorDia(db, query = {}, agora = new Date()) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), 7);
  const totais = new Map();
  for (const venda of db.vendas) {
    if (venda.status !== 'Concluída') continue;
    const dia = dataDaVenda(venda);
    if (noPeriodo(dia, periodo)) totais.set(dia, (totais.get(dia) ?? 0) + venda.total);
  }
  const dias = [];
  for (let dia = periodo.dataInicio; dia <= periodo.dataFim; dia = somarDias(dia, 1)) {
    dias.push({ data: dia, dia: `${dia.slice(8, 10)}/${dia.slice(5, 7)}`, vendas: arredondar(totais.get(dia) ?? 0) });
  }
  return dias;
}

export function vendasPorCategoria(db, query = {}, agora = new Date()) {
  const totais = new Map();
  for (const venda of vendasConcluidasNoPeriodo(db, query, agora, 30)) {
    const fator = fatorDesconto(venda);
    for (const item of venda.itens) totais.set(item.categoria, (totais.get(item.categoria) ?? 0) + item.totalItem * fator);
  }
  return [...totais]
    .map(([categoria, valor]) => ({ categoria, nome: db.categorias.find((c) => c.id === categoria)?.nome ?? categoria, valor: arredondar(valor) }))
    .filter((linha) => linha.valor > 0)
    .sort((a, b) => b.valor - a.valor);
}

export function produtosMaisVendidos(db, query = {}, agora = new Date()) {
  const limite = inteiroLimitado(query.limite, 5, 1, 50);
  const totais = new Map();
  for (const venda of vendasConcluidasNoPeriodo(db, query, agora, 30)) {
    const fator = fatorDesconto(venda);
    for (const item of venda.itens) {
      const atual = totais.get(item.produtoId) ?? { produtoId: item.produtoId, nome: item.nome, vendas: 0, receita: 0 };
      atual.vendas += item.quantidade;
      atual.receita += item.totalItem * fator;
      totais.set(item.produtoId, atual);
    }
  }
  return [...totais.values()]
    .sort((a, b) => b.vendas - a.vendas || b.receita - a.receita)
    .slice(0, limite)
    .map((linha) => ({
      ...linha,
      nome: db.produtos.find((p) => p.id === linha.produtoId)?.nome ?? linha.nome,
      receita: arredondar(linha.receita),
    }));
}

export function melhoresClientes(db, query = {}, agora = new Date()) {
  const limite = inteiroLimitado(query.limite, 5, 1, 50);
  const totais = new Map();
  for (const venda of vendasConcluidasNoPeriodo(db, query, agora, 30)) {
    if (!venda.clienteId) continue;
    const atual = totais.get(venda.clienteId) ?? { clienteId: venda.clienteId, nome: venda.cliente, total: 0, compras: 0 };
    atual.total += venda.total;
    atual.compras += 1;
    totais.set(venda.clienteId, atual);
  }
  return [...totais.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limite)
    .map((linha) => ({
      ...linha,
      nome: db.clientes.find((c) => c.id === linha.clienteId)?.nome ?? linha.nome,
      total: arredondar(linha.total),
    }));
}

// ---------------------------------------------------------------- Configurações

export const obterConfiguracoes = (db) => db.configuracoes;

export function salvarConfiguracoes(db, dados) {
  const loja = dados?.loja ?? {};
  const nome = texto(loja.nome);
  if (!nome) falhar(400, 'Informe o nome da loja.');
  const cnpj = texto(loja.cnpj);
  if (cnpj && somenteDigitos(cnpj).length !== 14) falhar(400, 'O CNPJ deve ter 14 dígitos.');
  const telefone = texto(loja.telefone);
  const digitosTelefone = somenteDigitos(telefone);
  if (digitosTelefone && (digitosTelefone.length < 10 || digitosTelefone.length > 11)) falhar(400, 'Telefone deve ter DDD e 8 ou 9 dígitos.');
  const modelo = dados?.impressao?.modelo ?? MODELOS_IMPRESSAO[0];
  if (!MODELOS_IMPRESSAO.includes(modelo)) falhar(400, `Modelo de impressão inválido. Use: ${MODELOS_IMPRESSAO.join(', ')}.`);

  db.configuracoes = {
    loja: { nome, cnpj, telefone, endereco: texto(loja.endereco) },
    notificacoes: {
      push: Boolean(dados?.notificacoes?.push),
      alertaEstoqueBaixo: Boolean(dados?.notificacoes?.alertaEstoqueBaixo),
    },
    impressao: {
      automatica: Boolean(dados?.impressao?.automatica),
      modelo,
      mensagemRodape: texto(dados?.impressao?.mensagemRodape),
    },
    seguranca: { doisFatores: Boolean(dados?.seguranca?.doisFatores) },
  };
  return db.configuracoes;
}
