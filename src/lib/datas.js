// Datas no formato "AAAA-MM-DD" sempre no fuso local, sem passar por UTC.
// Este módulo usa apenas imports relativos para também rodar no servidor de demonstração e nos testes.

const pad = (n) => String(n).padStart(2, '0');

const MESES_ABREVIADOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function dataLocalISO(data = new Date()) {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export function lerDataISO(dataISO) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export const dataISOValida = (valor) =>
  typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && dataLocalISO(lerDataISO(valor)) === valor;

export function somarDias(dataISO, dias) {
  const data = lerDataISO(dataISO);
  data.setDate(data.getDate() + dias);
  return dataLocalISO(data);
}

export const inicioDoMes = (data = new Date()) => dataLocalISO(new Date(data.getFullYear(), data.getMonth(), 1));

export const nomeMesAbreviado = (indiceMes) => MESES_ABREVIADOS[indiceMes];

// Quantidade de dias entre duas datas "AAAA-MM-DD" (fim - início)
export function diferencaEmDias(inicioISO, fimISO) {
  return Math.round((lerDataISO(fimISO) - lerDataISO(inicioISO)) / 86_400_000);
}

// Períodos rápidos usados nos filtros de data
export function periodoRapido(tipo, hoje = new Date()) {
  const fim = dataLocalISO(hoje);
  switch (tipo) {
    case 'hoje':
      return { dataInicio: fim, dataFim: fim };
    case '7dias':
      return { dataInicio: somarDias(fim, -6), dataFim: fim };
    case '30dias':
      return { dataInicio: somarDias(fim, -29), dataFim: fim };
    case 'mes':
    default:
      return { dataInicio: inicioDoMes(hoje), dataFim: fim };
  }
}
