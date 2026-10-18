// Financeiro (seção 7 do contrato)
import { arredondar } from '../../../lib/dinheiro.js';
import { dataLocalISO, dataISOValida, nomeMesAbreviado } from '../../../lib/datas.js';
import { falhar, inteiroLimitado, lerPeriodo, noPeriodo, numeroDoId, proximo, texto } from './base.js';

// Categorias aceitas no lançamento manual. Lançadas automaticamente: "Vendas" (venda),
// "Estornos" (cancelamento de venda) e "Fornecedores" (recebimento de compra).
export const CATEGORIAS_TRANSACAO = {
  entrada: ['Vendas', 'Serviços', 'Outros'],
  saida: ['Fornecedores', 'Fixos', 'Pessoal', 'Impostos', 'Outros'],
};

// Lançamento automático (vendas, estornos e compras), sem as validações do lançamento manual
export function lancarTransacao(db, { descricao, tipo, valor, data, categoria, vendaId, compraId }) {
  const transacao = {
    id: `t${proximo(db, 'transacao')}`,
    descricao,
    tipo,
    valor,
    data,
    categoria,
    ...(vendaId && { vendaId }),
    ...(compraId && { compraId }),
  };
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
