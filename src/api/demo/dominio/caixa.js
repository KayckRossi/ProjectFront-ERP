// Caixa: abertura, sangria, suprimento e fechamento (seção "Caixa" do contrato).
// Cada usuário tem no máximo um caixa aberto; as vendas registradas por ele entram nesse caixa.
import { arredondar } from '../../../lib/dinheiro.js';
import { dataLocalISO } from '../../../lib/datas.js';
import { pode } from '../../../lib/permissoes.js';
import { dataLocalDe, falhar, formatarReais, lerPeriodo, maisRecentePor, noPeriodo, proximo, texto } from './base.js';

export const TIPOS_MOVIMENTO_CAIXA = ['sangria', 'suprimento'];
export const STATUS_CAIXA = ['aberta', 'fechada'];

export const sessaoAbertaDoUsuario = (db, usuarioId) =>
  db.caixas.find((s) => s.status === 'aberta' && s.usuarioId === usuarioId) ?? null;

// Totais da sessão. Em dinheiro, o esperado é: fundo inicial + vendas em dinheiro + suprimentos - sangrias.
// Vendas canceladas não entram (o valor volta para o cliente).
export function resumoSessao(db, sessao) {
  const vendas = db.vendas.filter((v) => v.caixaId === sessao.id);
  const concluidas = vendas.filter((v) => v.status === 'Concluída');
  const porFormaPagamento = { dinheiro: 0, cartao: 0, pix: 0 };
  for (const venda of concluidas) porFormaPagamento[venda.formaPagamento] += venda.total;
  const somarMovimentos = (tipo) => sessao.movimentos.filter((m) => m.tipo === tipo).reduce((soma, m) => soma + m.valor, 0);
  const suprimentos = arredondar(somarMovimentos('suprimento'));
  const sangrias = arredondar(somarMovimentos('sangria'));
  const esperadoEmDinheiro = arredondar(sessao.valorInicial + porFormaPagamento.dinheiro + suprimentos - sangrias);
  return {
    quantidadeVendas: concluidas.length,
    vendasCanceladas: vendas.length - concluidas.length,
    totalVendas: arredondar(concluidas.reduce((soma, v) => soma + v.total, 0)),
    porFormaPagamento: {
      dinheiro: arredondar(porFormaPagamento.dinheiro),
      cartao: arredondar(porFormaPagamento.cartao),
      pix: arredondar(porFormaPagamento.pix),
    },
    suprimentos,
    sangrias,
    esperadoEmDinheiro,
    diferenca: sessao.status === 'fechada' ? arredondar(sessao.valorContado - esperadoEmDinheiro) : null,
  };
}

const visaoSessao = (db, sessao) => ({ ...sessao, resumo: resumoSessao(db, sessao) });

export function caixaAtual(db, usuario) {
  const sessao = sessaoAbertaDoUsuario(db, usuario.id);
  return sessao ? visaoSessao(db, sessao) : null;
}

export function abrirCaixa(db, dados, usuario, agora = new Date()) {
  if (sessaoAbertaDoUsuario(db, usuario.id)) falhar(409, 'Você já tem um caixa aberto.');
  const valorInicial = Number(dados?.valorInicial ?? 0);
  if (!Number.isFinite(valorInicial) || valorInicial < 0) falhar(400, 'O valor inicial deve ser maior ou igual a zero.');
  const numero = proximo(db, 'caixa');
  const sessao = {
    id: `cx${numero}`,
    numero,
    usuarioId: usuario.id,
    operador: usuario.nome,
    status: 'aberta',
    abertaEm: agora.toISOString(),
    valorInicial: arredondar(valorInicial),
    movimentos: [],
    fechadaEm: null,
    valorContado: null,
    observacoes: null,
  };
  db.caixas.push(sessao);
  return visaoSessao(db, sessao);
}

export function movimentarCaixa(db, dados, usuario, agora = new Date()) {
  const sessao = sessaoAbertaDoUsuario(db, usuario.id) ?? falhar(409, 'Abra o caixa antes de registrar sangria ou suprimento.');
  if (!TIPOS_MOVIMENTO_CAIXA.includes(dados?.tipo)) falhar(400, 'Tipo inválido. Use "sangria" ou "suprimento".');
  const valor = Number(dados.valor);
  if (!(valor > 0)) falhar(400, 'O valor deve ser maior que zero.');
  if (dados.tipo === 'sangria') {
    const { esperadoEmDinheiro } = resumoSessao(db, sessao);
    if (valor > esperadoEmDinheiro) falhar(409, `A sangria é maior que o dinheiro em caixa (${formatarReais(esperadoEmDinheiro)}).`);
  }
  sessao.movimentos.push({
    id: `mv${proximo(db, 'movimentoCaixa')}`,
    tipo: dados.tipo,
    valor: arredondar(valor),
    motivo: texto(dados.motivo) || null,
    data: agora.toISOString(),
  });
  return visaoSessao(db, sessao);
}

export function fecharCaixa(db, dados, usuario, agora = new Date()) {
  const sessao = sessaoAbertaDoUsuario(db, usuario.id) ?? falhar(409, 'Você não tem caixa aberto.');
  const valorContado = Number(dados?.valorContado);
  if (dados?.valorContado == null || !Number.isFinite(valorContado) || valorContado < 0) {
    falhar(400, 'Informe o valor contado em dinheiro.');
  }
  sessao.status = 'fechada';
  sessao.fechadaEm = agora.toISOString();
  sessao.valorContado = arredondar(valorContado);
  sessao.observacoes = texto(dados.observacoes) || null;
  return visaoSessao(db, sessao);
}

export function listarSessoesCaixa(db, query = {}, agora = new Date()) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), 30);
  if (query.status && !STATUS_CAIXA.includes(query.status)) falhar(400, 'Status inválido. Use "aberta" ou "fechada".');
  return db.caixas
    .filter(
      (s) =>
        noPeriodo(dataLocalDe(s.abertaEm), periodo) &&
        (!query.status || s.status === query.status) &&
        (!query.usuarioId || s.usuarioId === query.usuarioId),
    )
    .sort(maisRecentePor('abertaEm'))
    .map((s) => visaoSessao(db, s));
}

export function obterSessaoCaixa(db, id, usuario) {
  const sessao = db.caixas.find((s) => s.id === id) ?? falhar(404, 'Caixa não encontrado.');
  if (sessao.usuarioId !== usuario.id && !pode(usuario.role, 'caixa.ver-todos')) {
    falhar(403, 'Você só pode ver os seus próprios caixas.');
  }
  return visaoSessao(db, sessao);
}
