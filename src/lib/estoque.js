// Regra de status de estoque (CONTRATO_API_BACKEND.md, seção 3), usada pelo servidor de demonstração

export function statusEstoque(p) {
  const estoque = p.estoque ?? 0;
  const estoqueMin = p.estoqueMinimo ?? 0;
  if (estoque === 0) return 'Sem Estoque';
  if (estoque < estoqueMin) return 'Crítico';
  if (estoque < estoqueMin * 1.5) return 'Baixo';
  return 'OK';
}
