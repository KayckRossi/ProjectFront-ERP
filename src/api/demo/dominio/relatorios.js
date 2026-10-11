// Dashboard e relatórios (seção 8 do contrato). Consideram apenas vendas concluídas.
import { statusEstoque } from '../../../lib/estoque.js';
import { arredondar } from '../../../lib/dinheiro.js';
import { dataLocalISO, somarDias } from '../../../lib/datas.js';
import { dataLocalDe, inteiroLimitado, lerPeriodo, noPeriodo, somar } from './base.js';

export function kpisDashboard(db, agora = new Date()) {
  const hoje = dataLocalISO(agora);
  const mesAtual = hoje.slice(0, 7);
  const concluidas = db.vendas.filter((v) => v.status === 'Concluída');
  const deHoje = concluidas.filter((v) => dataLocalDe(v.data) === hoje);
  const vendasHoje = arredondar(somar(deHoje, 'total'));
  return {
    vendasHoje,
    quantidadeVendasHoje: deHoje.length,
    ticketMedio: deHoje.length ? arredondar(vendasHoje / deHoje.length) : 0,
    produtosEmBaixa: db.produtos.filter((p) => statusEstoque(p) !== 'OK').length,
    faturamentoMensal: arredondar(somar(concluidas.filter((v) => dataLocalDe(v.data).startsWith(mesAtual)), 'total')),
  };
}

function vendasConcluidasNoPeriodo(db, query, agora, diasPadrao) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), diasPadrao);
  return db.vendas.filter((v) => v.status === 'Concluída' && noPeriodo(dataLocalDe(v.data), periodo));
}

// Rateia o desconto da venda entre os itens, para os totais por produto/categoria baterem com o faturamento
const fatorDesconto = (venda) => (venda.subtotal > 0 ? venda.total / venda.subtotal : 0);

export function vendasPorDia(db, query = {}, agora = new Date()) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), 7);
  const totais = new Map();
  for (const venda of db.vendas) {
    if (venda.status !== 'Concluída') continue;
    const dia = dataLocalDe(venda.data);
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
