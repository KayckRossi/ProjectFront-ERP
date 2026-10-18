// Auditoria: registro de quem fez o quê e quando (seção "Auditoria" do contrato)
import { dataLocalISO } from '../../../lib/datas.js';
import { PERFIS } from '../../../lib/permissoes.js';
import { normalizarTexto } from '../../../lib/texto.js';
import { dataLocalDe, falhar, formatarReais, lerPeriodo, maisRecentePor, noPeriodo, proximo } from './base.js';
import { FORMAS_PAGAMENTO } from './vendas.js';

export const ENTIDADES_AUDITORIA = {
  sessao: 'Acesso',
  usuario: 'Usuário',
  produto: 'Produto',
  categoria: 'Categoria',
  estoque: 'Estoque',
  cliente: 'Cliente',
  venda: 'Venda',
  pedido: 'Pedido',
  transacao: 'Financeiro',
  fornecedor: 'Fornecedor',
  compra: 'Compra',
  caixa: 'Caixa',
  configuracoes: 'Configurações',
};

const ROTULOS_PEDIDO = { pendente: 'Pendente', em_preparo: 'Em preparo', finalizado: 'Finalizado' };
const quantidadeDeItens = (itens) => itens.reduce((soma, item) => soma + item.quantidade, 0);

// Eventos auditados: cada um recebe o registro afetado e devolve ação, entidade e descrição
const EVENTOS = {
  'sessao.login': (u) => ({ acao: 'entrou', entidade: 'sessao', entidadeId: u.id, descricao: 'Entrou no sistema' }),
  'sessao.encerrar-outras': () => ({ acao: 'encerrou', entidade: 'sessao', descricao: 'Encerrou as outras sessões abertas' }),
  'usuario.criado': (u) => ({ acao: 'criou', entidade: 'usuario', entidadeId: u.id, descricao: `Criou o usuário ${u.nome} (${PERFIS[u.role]})` }),
  'usuario.alterado': (u) => ({ acao: 'atualizou', entidade: 'usuario', entidadeId: u.id, descricao: `Alterou o usuário ${u.nome} (${PERFIS[u.role]}${u.ativo ? '' : ', desativado'})` }),
  'usuario.senha': (u) => ({ acao: 'atualizou', entidade: 'usuario', entidadeId: u.id, descricao: `Enviou a redefinição de senha para ${u.nome}` }),
  'categoria.criada': (c) => ({ acao: 'criou', entidade: 'categoria', entidadeId: c.id, descricao: `Criou a categoria ${c.nome}` }),
  'categoria.alterada': (c) => ({ acao: 'atualizou', entidade: 'categoria', entidadeId: c.id, descricao: `Alterou a categoria ${c.nome}` }),
  'categoria.excluida': (c) => ({ acao: 'excluiu', entidade: 'categoria', entidadeId: c.id, descricao: `Excluiu a categoria ${c.nome}` }),
  'produto.criado': (p) => ({ acao: 'criou', entidade: 'produto', entidadeId: p.id, descricao: `Cadastrou o produto ${p.nome}` }),
  'produto.alterado': (p) => ({ acao: 'atualizou', entidade: 'produto', entidadeId: p.id, descricao: `Alterou o produto ${p.nome} (preço ${formatarReais(p.preco)})` }),
  'produto.excluido': (p) => ({ acao: 'excluiu', entidade: 'produto', entidadeId: p.id, descricao: `Excluiu o produto ${p.nome}` }),
  'estoque.movimentado': ({ produto, tipo, quantidade }) => ({
    acao: 'movimentou',
    entidade: 'estoque',
    entidadeId: produto.id,
    descricao: `${tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${quantidade} un. de ${produto.nome} (estoque: ${produto.estoque})`,
  }),
  'cliente.criado': (c) => ({ acao: 'criou', entidade: 'cliente', entidadeId: c.id, descricao: `Cadastrou o cliente ${c.nome}` }),
  'cliente.alterado': (c) => ({ acao: 'atualizou', entidade: 'cliente', entidadeId: c.id, descricao: `Alterou o cliente ${c.nome}` }),
  'cliente.excluido': (c) => ({ acao: 'excluiu', entidade: 'cliente', entidadeId: c.id, descricao: `Excluiu o cliente ${c.nome}` }),
  'venda.registrada': (v) => ({
    acao: 'registrou',
    entidade: 'venda',
    entidadeId: v.id,
    descricao: `Registrou a venda #${v.numero} de ${formatarReais(v.total)} (${FORMAS_PAGAMENTO[v.formaPagamento]})`,
  }),
  'venda.cancelada': (v) => ({
    acao: 'cancelou',
    entidade: 'venda',
    entidadeId: v.id,
    descricao: `Cancelou a venda #${v.numero} de ${formatarReais(v.total)}${v.motivoCancelamento ? `: ${v.motivoCancelamento}` : ''}`,
  }),
  'pedido.movido': (p) => ({ acao: 'atualizou', entidade: 'pedido', entidadeId: p.id, descricao: `Moveu o pedido ${p.id} para ${ROTULOS_PEDIDO[p.status]}` }),
  'transacao.lancada': (t) => ({
    acao: 'criou',
    entidade: 'transacao',
    entidadeId: t.id,
    descricao: `Lançou ${t.tipo === 'entrada' ? 'a entrada' : 'a saída'} "${t.descricao}" de ${formatarReais(t.valor)}`,
  }),
  'fornecedor.criado': (f) => ({ acao: 'criou', entidade: 'fornecedor', entidadeId: f.id, descricao: `Cadastrou o fornecedor ${f.nomeFantasia || f.razaoSocial}` }),
  'fornecedor.alterado': (f) => ({ acao: 'atualizou', entidade: 'fornecedor', entidadeId: f.id, descricao: `Alterou o fornecedor ${f.nomeFantasia || f.razaoSocial}` }),
  'fornecedor.excluido': (f) => ({ acao: 'excluiu', entidade: 'fornecedor', entidadeId: f.id, descricao: `Excluiu o fornecedor ${f.nomeFantasia || f.razaoSocial}` }),
  'compra.criada': (c) => ({ acao: 'criou', entidade: 'compra', entidadeId: c.id, descricao: `Criou a compra #${c.numero} de ${c.fornecedor} (${formatarReais(c.total)})` }),
  'compra.alterada': (c) => ({ acao: 'atualizou', entidade: 'compra', entidadeId: c.id, descricao: `Alterou a compra #${c.numero} (${formatarReais(c.total)})` }),
  'compra.recebida': (c) => ({
    acao: 'recebeu',
    entidade: 'compra',
    entidadeId: c.id,
    descricao: `Recebeu a compra #${c.numero} de ${c.fornecedor} (${quantidadeDeItens(c.itens)} un., ${formatarReais(c.total)})`,
  }),
  'compra.cancelada': (c) => ({ acao: 'cancelou', entidade: 'compra', entidadeId: c.id, descricao: `Cancelou a compra #${c.numero}${c.motivoCancelamento ? `: ${c.motivoCancelamento}` : ''}` }),
  'caixa.aberto': (s) => ({ acao: 'abriu', entidade: 'caixa', entidadeId: s.id, descricao: `Abriu o caixa #${s.numero} com fundo de ${formatarReais(s.valorInicial)}` }),
  'caixa.movimento': (s) => {
    const movimento = s.movimentos[s.movimentos.length - 1];
    const tipo = movimento.tipo === 'sangria' ? 'Sangria' : 'Suprimento';
    return {
      acao: 'movimentou',
      entidade: 'caixa',
      entidadeId: s.id,
      descricao: `${tipo} de ${formatarReais(movimento.valor)} no caixa #${s.numero}${movimento.motivo ? `: ${movimento.motivo}` : ''}`,
    };
  },
  'caixa.fechado': (s) => ({
    acao: 'fechou',
    entidade: 'caixa',
    entidadeId: s.id,
    descricao: `Fechou o caixa #${s.numero} (diferença de ${formatarReais(s.resumo.diferenca)})`,
  }),
  'configuracoes.alteradas': () => ({ acao: 'atualizou', entidade: 'configuracoes', descricao: 'Alterou as configurações da loja' }),
};

// Mantém só os registros mais recentes no navegador
const LIMITE_REGISTROS_DEMO = 3000;
const LIMITE_RESPOSTA = 1000;

export function registrarEvento(db, evento, dados, usuario, agora = new Date()) {
  const { acao, entidade, entidadeId = null, descricao } = EVENTOS[evento](dados);
  db.auditoria.push({
    id: `a${proximo(db, 'auditoria')}`,
    data: agora.toISOString(),
    usuarioId: usuario?.id ?? null,
    usuario: usuario?.nome ?? 'Sistema',
    acao,
    entidade,
    entidadeId,
    descricao,
  });
  if (db.auditoria.length > LIMITE_REGISTROS_DEMO) db.auditoria.splice(0, db.auditoria.length - LIMITE_REGISTROS_DEMO);
}

export function listarAuditoria(db, query = {}, agora = new Date()) {
  const periodo = lerPeriodo(query, dataLocalISO(agora), 7);
  if (query.entidade && !ENTIDADES_AUDITORIA[query.entidade]) falhar(400, 'Entidade inválida.');
  const termo = normalizarTexto(query.busca);
  return db.auditoria
    .filter(
      (registro) =>
        noPeriodo(dataLocalDe(registro.data), periodo) &&
        (!query.usuarioId || registro.usuarioId === query.usuarioId) &&
        (!query.entidade || registro.entidade === query.entidade) &&
        (!termo || normalizarTexto(registro.descricao).includes(termo) || normalizarTexto(registro.usuario).includes(termo)),
    )
    .sort(maisRecentePor('data'))
    .slice(0, LIMITE_RESPOSTA);
}
