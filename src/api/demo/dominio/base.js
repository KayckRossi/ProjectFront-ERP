// Utilitários comuns às regras de negócio do servidor de demonstração.
import { dataLocalISO, dataISOValida, diferencaEmDias, somarDias } from '../../../lib/datas.js';

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export const falhar = (status, mensagem) => {
  throw new ErroApi(status, mensagem);
};

export const LIMITE_PERIODO_DIAS = 366;

export const texto = (valor) => String(valor ?? '').trim();

// Próximo número de uma sequência (venda, pedido, compra...)
export const proximo = (db, sequencia) => (db.sequencias[sequencia] = (db.sequencias[sequencia] ?? 0) + 1);

export const numeroDoId = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

// Ordena do mais recente para o mais antigo pelo campo de data (ISO) informado
export const maisRecentePor = (campo) => (a, b) => (a[campo] < b[campo] ? 1 : a[campo] > b[campo] ? -1 : 0);
export const maisRecentePrimeiro = maisRecentePor('data');

export const dataLocalDe = (dataHoraISO) => dataLocalISO(new Date(dataHoraISO));

export const somar = (lista, campo) => lista.reduce((soma, item) => soma + item[campo], 0);

// Usado nas descrições da auditoria
export const formatarReais = (valor) => `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;

export function inteiroLimitado(valor, padrao, minimo, maximo) {
  const numero = parseInt(valor, 10);
  return Number.isFinite(numero) ? Math.min(maximo, Math.max(minimo, numero)) : padrao;
}

// Período "dataInicio"/"dataFim" (AAAA-MM-DD, inclusive). Sem parâmetros, usa os últimos `diasPadrao` dias.
export function lerPeriodo(query, hoje, diasPadrao) {
  const dataFim = query.dataFim || hoje;
  const dataInicio = query.dataInicio || somarDias(dataFim, -(diasPadrao - 1));
  if (!dataISOValida(dataInicio) || !dataISOValida(dataFim)) falhar(400, 'As datas devem estar no formato AAAA-MM-DD.');
  if (dataInicio > dataFim) falhar(400, 'A data inicial deve ser anterior ou igual à data final.');
  if (diferencaEmDias(dataInicio, dataFim) >= LIMITE_PERIODO_DIAS) falhar(400, `O período máximo é de ${LIMITE_PERIODO_DIAS} dias.`);
  return { dataInicio, dataFim };
}

export const noPeriodo = (dataISO, { dataInicio, dataFim }) => dataISO >= dataInicio && dataISO <= dataFim;
