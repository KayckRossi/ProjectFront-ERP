import { useEffect, useState } from 'react';

// Paginação no navegador. A página volta para 1 quando `chaveReinicio` muda (ex.: filtros).
export function usePaginacao(itens, porPagina, chaveReinicio) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));

  useEffect(() => { setPagina(1); }, [chaveReinicio]);

  // Se uma exclusão reduzir o total de páginas, mostra a última disponível
  const paginaAtual = Math.min(pagina, totalPaginas);
  return {
    pagina: paginaAtual,
    setPagina,
    totalPaginas,
    itensPagina: itens.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
  };
}
