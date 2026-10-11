// Categorias, produtos e estoque (seções 2 e 3 do contrato)
import { statusEstoque } from '../../../lib/estoque.js';
import { arredondar } from '../../../lib/dinheiro.js';
import { normalizarTexto } from '../../../lib/texto.js';
import { falhar, proximo, texto } from './base.js';

// ---------------------------------------------------------------- Categorias

const COR_VALIDA = /^#[0-9a-fA-F]{6}$/;

const gerarSlug = (nome) => normalizarTexto(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const encontrarCategoria = (db, id) => db.categorias.find((c) => c.id === id) ?? falhar(404, 'Categoria não encontrada.');

function validarCategoria(db, dados, idAtual) {
  const nome = texto(dados?.nome);
  if (!nome) falhar(400, 'Informe o nome da categoria.');
  const cor = texto(dados.cor) || '#339989';
  if (!COR_VALIDA.test(cor)) falhar(400, 'A cor deve estar no formato #RRGGBB.');
  if (db.categorias.some((c) => c.id !== idAtual && normalizarTexto(c.nome) === normalizarTexto(nome))) {
    falhar(409, `Já existe a categoria ${nome}.`);
  }
  return { nome, cor: cor.toUpperCase() };
}

export const listarCategorias = (db) => db.categorias;

export function criarCategoria(db, dados) {
  const validado = validarCategoria(db, dados);
  // O id é um "slug" do nome (ex.: "Hortifruti" -> "hortifruti") e não muda se o nome mudar
  const base = gerarSlug(validado.nome) || 'categoria';
  let id = base;
  for (let n = 2; db.categorias.some((c) => c.id === id); n += 1) id = `${base}-${n}`;
  const categoria = { id, ...validado };
  db.categorias.push(categoria);
  return categoria;
}

export function atualizarCategoria(db, id, dados) {
  const categoria = encontrarCategoria(db, id);
  Object.assign(categoria, validarCategoria(db, dados, id));
  return categoria;
}

export function excluirCategoria(db, id) {
  const categoria = encontrarCategoria(db, id);
  const emUso = db.produtos.filter((p) => p.categoria === id).length;
  if (emUso) falhar(409, `A categoria ${categoria.nome} tem ${emUso} produto(s). Mova-os para outra categoria antes de excluir.`);
  db.categorias = db.categorias.filter((c) => c.id !== id);
  return { sucesso: true, mensagem: 'Categoria removida com sucesso' };
}

// ---------------------------------------------------------------- Produtos

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

export const encontrarProduto = (db, id) => db.produtos.find((p) => p.id === id) ?? falhar(404, 'Produto não encontrado.');

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

export const visaoEstoque = (p) => ({
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
