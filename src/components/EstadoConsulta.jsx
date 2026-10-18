import { AlertTriangle, RefreshCw } from 'lucide-react';

export function Carregando({ texto = 'Carregando...', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-16 text-sm text-snow/50 ${className}`}>
      <div className="w-5 h-5 border-2 border-graphite-hover border-t-verdigris rounded-full animate-spin" />
      {texto}
    </div>
  );
}

export function ErroConsulta({ erro, onTentarNovamente, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center py-14 px-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mb-3">
        <AlertTriangle size={22} className="text-danger" />
      </div>
      <p className="text-snow font-medium">Não foi possível carregar os dados</p>
      {erro?.message && <p className="text-sm text-snow/50 mt-1 max-w-sm">{erro.message}</p>}
      {onTentarNovamente && (
        <button
          onClick={() => onTentarNovamente()}
          className="mt-4 h-9 px-4 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw size={15} /> Tentar novamente
        </button>
      )}
    </div>
  );
}

// Renderiza carregamento/erro de uma consulta do React Query ou o conteúdo quando os dados chegam
export function EstadoConsulta({ consulta, children, textoCarregando, className }) {
  if (consulta.isPending) return <Carregando texto={textoCarregando} className={className} />;
  if (consulta.isError) return <ErroConsulta erro={consulta.error} onTentarNovamente={consulta.refetch} className={className} />;
  return children;
}
