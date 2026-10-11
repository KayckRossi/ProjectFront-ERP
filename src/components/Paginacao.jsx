export default function Paginacao({ pagina, totalPaginas, onMudar, totalItens, rotulo = 'registros' }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 p-4 border-t border-[rgba(125,226,209,0.10)] text-sm">
      <span className="text-snow/50">
        Página {pagina} de {totalPaginas}
        {totalItens != null && <span className="hidden sm:inline"> · {totalItens} {rotulo}</span>}
      </span>
      <div className="flex gap-2">
        <button onClick={() => onMudar(Math.max(1, pagina - 1))} disabled={pagina === 1} className="px-3 h-8 rounded-md bg-onyx text-snow/70 disabled:opacity-40 hover:text-pearl transition-colors">
          Anterior
        </button>
        <button onClick={() => onMudar(Math.min(totalPaginas, pagina + 1))} disabled={pagina === totalPaginas} className="px-3 h-8 rounded-md bg-onyx text-snow/70 disabled:opacity-40 hover:text-pearl transition-colors">
          Próxima
        </button>
      </div>
    </div>
  );
}
