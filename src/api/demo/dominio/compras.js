// Fornecedores e compras / entrada de mercadorias (seções "Fornecedores" e "Compras" do contrato)
import { arredondar } from '../../../lib/dinheiro.js';
import { dataLocalISO, somarDias } from '../../../lib/datas.js';
import { normalizarTexto, somenteDigitos } from '../../../lib/texto.js';
import { dataLocalDe, falhar, lerPeriodo, maisRecentePor, noPeriodo, proximo, texto } from './base.js';
import { validarEmailOpcional, validarTelefone } from './clientes.js';
import { lancarTransacao } from './financeiro.js';

export const STATUS_COMPRA = ['aberta', 'recebida', 'cancelada'];

// ---------------------------------------------------------------- Fornecedores

const encontrarFornecedor = (db, id) => db.fornecedores.find((f) => f.id === id) ?? falhar(404, 'Fornecedor não encontrado.');

export const nomeDoFornecedor = (fornecedor) => fornecedor.nomeFantasia || fornecedor.razaoSocial;

function validarFornecedor(db, dados, idAtual) {
  const razaoSocial = texto(dados?.razaoSocial);
  if (!razaoSocial) falhar(400, 'Informe a razão social do fornecedor.');
  const cnpj = texto(dados.cnpj);
  const digitosCnpj = somenteDigitos(cnpj);
  if (digitosCnpj && digitosCnpj.length !== 14) falhar(400, 'O CNPJ deve ter 14 dígitos.');
  if (digitosCnpj && db.fornecedores.some((f) => f.id !== idAtual && somenteDigitos(f.cnpj) === digitosCnpj)) {
    falhar(409, 'Já existe um fornecedor com este CNPJ.');
  }
  const telefone = texto(dados.telefone);
  validarTelefone(telefone);
  const email = texto(dados.email);
  validarEmailOpcional(email);
  const prazoPagamentoDias = Number(dados.prazoPagamentoDias ?? 30);
  if (!Number.isInteger(prazoPagamentoDias) || prazoPagamentoDias < 0 || prazoPagamentoDias > 365) {
    falhar(400, 'O prazo de pagamento deve ser um número inteiro de 0 a 365 dias.');
  }
  return {
    razaoSocial,
    nomeFantasia: texto(dados.nomeFantasia),
    cnpj,
    contato: texto(dados.contato),
    telefone,
    email,
    prazoPagamentoDias,
    observacoes: texto(dados.observacoes),
  };
}

export function listarFornecedores(db, query = {}) {
  if (!query.busca) return db.fornecedores;
  const termo = normalizarTexto(query.busca);
  const digitos = somenteDigitos(query.busca);
  return db.fornecedores.filter(
    (f) =>
      normalizarTexto(f.razaoSocial).includes(termo) ||
      normalizarTexto(f.nomeFantasia).includes(termo) ||
      normalizarTexto(f.contato).includes(termo) ||
      (digitos && somenteDigitos(f.cnpj).includes(digitos)),
  );
}

export function criarFornecedor(db, dados) {
  const fornecedor = { id: `f${proximo(db, 'fornecedor')}`, ...validarFornecedor(db, dados) };
  db.fornecedores.push(fornecedor);
  return fornecedor;
}

export function atualizarFornecedor(db, id, dados) {
  const fornecedor = encontrarFornecedor(db, id);
  Object.assign(fornecedor, validarFornecedor(db, dados, id));
  return fornecedor;
}

export function excluirFornecedor(db, id) {
  const fornecedor = encontrarFornecedor(db, id);
  if (db.compras.some((c) => c.fornecedorId === id)) {
    falhar(409, `${nomeDoFornecedor(fornecedor)} tem compras registradas e não pode ser excluído.`);
  }
  db.fornecedores = db.fornecedores.filter((f) => f.id !== id);
  return { sucesso: true, mensagem: 'Fornecedor removido com sucesso' };
}

// ---------------------------------------------------------------- Compras

const quantidadeDeItens = (itens) => itens.reduce((soma, item) => soma + item.quantidade, 0);

const resumoCompra = (c) => ({
  id: c.id,
  numero: c.numero,
  fornecedorId: c.fornecedorId,
  fornecedor: c.fornecedor,
  status: c.status,
  itens: quantidadeDeItens(c.itens),
  total: c.total,
  criadaEm: c.criadaEm,
  recebidaEm: c.recebidaEm,
  vencimento: c.vencimento,
});

const encontrarCompra = (db, id) => db.compras.find((c) => c.id === id) ?? falhar(404, 'Compra não encontrada.');

function validarCompra(db, dados) {
  const fornecedor = db.fornecedores.find((f) => f.id === dados?.fornecedorId) ?? falhar(400, 'O fornecedor informado não existe.');
  const itensEnviados = Array.isArray(dados.itens) ? dados.itens : [];
  if (!itensEnviados.length) falhar(400, 'A compra precisa ter ao menos um item.');
  const vistos = new Set();
  const itens = itensEnviados.map((item) => {
    const produto = db.produtos.find((p) => p.id === item?.produtoId) ?? falhar(400, `O produto ${item?.produtoId} não existe.`);
    if (vistos.has(produto.id)) falhar(400, `O produto ${produto.nome} aparece mais de uma vez na compra.`);
    vistos.add(produto.id);
    const quantidade = Number(item.quantidade);
    if (!Number.isInteger(quantidade) || quantidade < 1) falhar(400, 'A quantidade de cada item deve ser um inteiro maior que zero.');
    const custoUnitario = Number(item.custoUnitario);
    if (!(custoUnitario > 0)) falhar(400, `Informe o custo unitário de ${produto.nome}.`);
    return { produtoId: produto.id, nome: produto.nome, quantidade, custoUnitario: arredondar(custoUnitario), totalItem: arredondar(custoUnitario * quantidade) };
  });
  return {
    fornecedorId: fornecedor.id,
    fornecedor: nomeDoFornecedor(fornecedor),
    itens,
    total: arredondar(itens.reduce((soma, item) => soma + item.totalItem, 0)),
    observacoes: texto(dados.observacoes),
  };
}

export function criarCompra(db, dados, agora = new Date(), usuario = null) {
  const validado = validarCompra(db, dados);
  const numero = proximo(db, 'compra');
  const compra = {
    id: `cp${numero}`,
    numero,
    ...validado,
    status: 'aberta',
    criadaEm: agora.toISOString(),
    criadaPor: usuario?.nome ?? null,
    recebidaEm: null,
    recebidaPor: null,
    vencimento: null,
    canceladaEm: null,
    motivoCancelamento: null,
  };
  db.compras.push(compra);
  return compra;
}

const exigirAberta = (compra, acao) => {
  if (compra.status !== 'aberta') falhar(409, `Somente compras abertas podem ser ${acao}. Esta compra está ${compra.status}.`);
};

export function atualizarCompra(db, id, dados) {
  const compra = encontrarCompra(db, id);
  exigirAberta(compra, 'alteradas');
  Object.assign(compra, validarCompra(db, dados));
  return compra;
}

// Entrada da mercadoria: soma ao estoque, atualiza o custo (opcional) e lança a despesa no financeiro
export function receberCompra(db, id, dados = {}, agora = new Date(), usuario = null) {
  const compra = encontrarCompra(db, id);
  exigirAberta(compra, 'recebidas');
  const produtos = compra.itens.map(
    (item) => db.produtos.find((p) => p.id === item.produtoId) ?? falhar(409, `O produto ${item.nome} não existe mais no cadastro.`),
  );
  const atualizarCusto = dados?.atualizarCusto !== false;
  const alertasPreco = [];
  compra.itens.forEach((item, i) => {
    const produto = produtos[i];
    produto.estoque += item.quantidade;
    if (atualizarCusto) {
      produto.custo = item.custoUnitario;
      if (produto.preco < produto.custo) alertasPreco.push({ produtoId: produto.id, nome: produto.nome, custo: produto.custo, preco: produto.preco });
    }
  });
  const fornecedor = db.fornecedores.find((f) => f.id === compra.fornecedorId);
  const hoje = dataLocalISO(agora);
  compra.status = 'recebida';
  compra.recebidaEm = agora.toISOString();
  compra.recebidaPor = usuario?.nome ?? null;
  compra.vencimento = somarDias(hoje, fornecedor?.prazoPagamentoDias ?? 0);
  lancarTransacao(db, {
    descricao: `Compra #${compra.numero} - ${compra.fornecedor}`,
    tipo: 'saida',
    valor: compra.total,
    data: hoje,
    categoria: 'Fornecedores',
    compraId: compra.id,
  });
  // Os alertas não ficam salvos: avisam na hora quais produtos ficaram com custo acima do preço
  return { ...compra, alertasPreco };
}

export function cancelarCompra(db, id, dados = {}, agora = new Date()) {
  const compra = encontrarCompra(db, id);
  exigirAberta(compra, 'canceladas');
  compra.status = 'cancelada';
  compra.canceladaEm = agora.toISOString();
  compra.motivoCancelamento = texto(dados?.motivo) || null;
  return compra;
}

export const obterCompra = (db, id) => encontrarCompra(db, id);

export function listarCompras(db, query = {}, agora = new Date()) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), 90);
  if (query.status && !STATUS_COMPRA.includes(query.status)) falhar(400, 'Status inválido. Use "aberta", "recebida" ou "cancelada".');
  const termo = normalizarTexto(query.busca);
  const numeroBuscado = somenteDigitos(query.busca);
  return db.compras
    .filter(
      (c) =>
        // Compras abertas aparecem sempre, mesmo criadas antes do período
        (c.status === 'aberta' && query.status === 'aberta' ? true : noPeriodo(dataLocalDe(c.criadaEm), periodo)) &&
        (!query.status || c.status === query.status) &&
        (!query.fornecedorId || c.fornecedorId === query.fornecedorId) &&
        (!termo || normalizarTexto(c.fornecedor).includes(termo) || (numeroBuscado && String(c.numero).includes(numeroBuscado))),
    )
    .sort(maisRecentePor('criadaEm'))
    .map(resumoCompra);
}
