import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const isIframe = typeof window !== 'undefined' && window.self !== window.top;

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatNumber = (value) =>
  new Intl.NumberFormat('pt-BR').format(value || 0);

// "2026-09-29" seria interpretado como meia-noite UTC (dia anterior no Brasil);
// datas sem horário são tratadas como data local.
export const parseDate = (date) => {
  if (typeof date !== 'string') return date;
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return soData ? new Date(+soData[1], +soData[2] - 1, +soData[3]) : new Date(date);
};

export const formatDate = (date) => {
  const d = parseDate(date);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

export const formatDateTime = (date) => {
  const d = parseDate(date);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
