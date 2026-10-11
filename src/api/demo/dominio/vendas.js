// Vendas (seção 5) e Kanban de pedidos (seção 6)
import { arredondar, calcularTotais } from '../../../lib/dinheiro.js';
import { dataLocalISO } from '../../../lib/datas.js';
import { normalizarTexto, somenteDigitos } from '../../../lib/texto.js';
import { dataLocalDe, falhar, inteiroLimitado, lerPeriodo, maisRecentePrimeiro, maisRecentePor, noPeriodo, proximo, texto } from './base.js';
import { lancarTransacao } from './financeiro.js';
import { sessaoAbertaDoUsuario } from './caixa.js';

export const FORMAS_PAGAMENTO = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };
export const STATUS_VENDA = ['Concluída', 'Cancelada'];
export const STATUS_PEDIDO = ['pendente', 'em_preparo', 'finalizado'];

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
  operador: v.operador ?? null,
  data: v.data,
});

// `usuario` é quem está vendendo (vem do token); a venda entra no caixa aberto dele
export function registrarVenda(db, dados, agora = new Date(), usuario = null) {
  const sessaoCaixa = usuario ? sessaoAbertaDoUsuario(db, usuario.id) : null;
  if (db.configuracoes?.pdv?.exigirCaixaAberto !== false && !sessaoCaixa) {
    falhar(409, 'Abra o caixa antes de registrar vendas.');
  }

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
    caixaId: sessaoCaixa?.id ?? null,
    usuarioId: usuario?.id ?? null,
    operador: usuario?.nome ?? null,
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
        noPeriodo(dataLocalDe(v.data), periodo) &&
        (!query.status || v.status === query.status) &&
        (!query.formaPagamento || v.formaPagamento === query.formaPagamento) &&
        (!query.clienteId || v.clienteId === query.clienteId) &&
        (!query.caixaId || v.caixaId === query.caixaId) &&
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
export function cancelarVenda(db, id, dados = {}, agora = new Date(), usuario = null) {
  const venda = obterVenda(db, id);
  if (venda.status === 'Cancelada') falhar(409, 'Esta venda já foi cancelada.');
  venda.status = 'Cancelada';
  venda.canceladaEm = agora.toISOString();
  venda.canceladaPor = usuario?.nome ?? null;
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
    .sort(maisRecentePor('data'));
}

export function atualizarStatusPedido(db, id, dados, agora = new Date()) {
  const pedido = db.pedidos.find((p) => p.id === id) ?? falhar(404, 'Pedido não encontrado.');
  if (!STATUS_PEDIDO.includes(dados?.status)) falhar(400, 'Status inválido. Use "pendente", "em_preparo" ou "finalizado".');
  if (pedido.status === 'cancelado') falhar(409, 'O pedido pertence a uma venda cancelada.');
  pedido.status = dados.status;
  pedido.atualizadoEm = agora.toISOString();
  return { id: pedido.id, status: pedido.status, mensagem: 'Status do pedido atualizado com sucesso' };
}
