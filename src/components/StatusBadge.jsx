const styles = {
  Concluída: 'bg-pearl-muted text-pearl border-pearl/30',
  Pendente: 'bg-warning/15 text-warning border-warning/30',
  Cancelada: 'bg-danger/15 text-danger border-danger/30',
  OK: 'bg-pearl-muted text-pearl border-pearl/30',
  Baixo: 'bg-warning/15 text-warning border-warning/30',
  Crítico: 'bg-danger/15 text-danger border-danger/30',
  'Sem Estoque': 'bg-danger/15 text-danger border-danger/30',
  entrada: 'bg-pearl-muted text-pearl border-pearl/30',
  saida: 'bg-danger/15 text-danger border-danger/30',
};

export default function StatusBadge({ status }) {
  const cls = styles[status] || 'bg-graphite-hover text-snow/70 border-snow/10';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status === 'entrada' ? 'Entrada' : status === 'saida' ? 'Saída' : status}
    </span>
  );
}
