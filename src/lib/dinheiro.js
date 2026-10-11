// Cálculos monetários compartilhados entre o PDV e o servidor de demonstração,
// garantindo que o total exibido seja exatamente o que o backend vai recalcular.

export const arredondar = (valor) => Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

// itens: [{ preco, quantidade }]
export function calcularTotais(itens, descontoPercentual = 0) {
  const subtotal = arredondar(itens.reduce((soma, item) => soma + arredondar(item.preco * item.quantidade), 0));
  const desconto = arredondar((subtotal * descontoPercentual) / 100);
  return { subtotal, desconto, total: arredondar(subtotal - desconto) };
}

// Aceita "10,50", "10.50" e "1.234,56"
export function lerValorMonetario(texto) {
  const limpo = String(texto ?? '').trim().replace(/\s/g, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const valor = parseFloat(normalizado);
  return Number.isFinite(valor) ? valor : 0;
}
