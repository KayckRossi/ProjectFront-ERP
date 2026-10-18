import { somenteDigitos } from './texto.js';

export function mascaraCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

// Formata CPF (até 11 dígitos) ou CNPJ (12 a 14 dígitos) conforme o usuário digita
export function mascaraDocumento(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  if (d.length > 11) return mascaraCnpj(d);
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
