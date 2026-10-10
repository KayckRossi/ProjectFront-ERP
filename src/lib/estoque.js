// Regras de status de estoque compartilhadas entre Estoque e Dashboard

export function statusEstoque(p) {
  const estoque = p.estoque ?? 0;
  const estoqueMin = p.estoqueMinimo ?? 0;
  if (estoque === 0) return 'Sem Estoque';
  if (estoque < estoqueMin) return 'Crítico';
  if (estoque < estoqueMin * 1.5) return 'Baixo';
  return 'OK';
}

// Produtos que ainda têm unidades, mas precisam de reposição
export const estoqueBaixo = (p) => {
  const estoque = p.estoque ?? 0;
  return estoque > 0 && estoque < (p.estoqueMinimo ?? 0) * 1.5;
};
