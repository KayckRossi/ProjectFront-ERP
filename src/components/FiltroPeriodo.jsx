import { Calendar } from 'lucide-react';
import { periodoRapido } from '@/lib/datas';

const ATALHOS = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: '7dias', rotulo: '7 dias' },
  { id: 'mes', rotulo: 'Este mês' },
  { id: '30dias', rotulo: '30 dias' },
];

const classeCampo = 'h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

// Datas inicial/final (AAAA-MM-DD) com atalhos. Nunca deixa o início depois do fim.
export default function FiltroPeriodo({ periodo, onMudar, id = 'periodo' }) {
  const atalhoAtivo = ATALHOS.find((atalho) => {
    const p = periodoRapido(atalho.id);
    return p.dataInicio === periodo.dataInicio && p.dataFim === periodo.dataFim;
  })?.id;

  const mudarInicio = (dataInicio) => {
    if (!dataInicio) return;
    onMudar({ dataInicio, dataFim: dataInicio > periodo.dataFim ? dataInicio : periodo.dataFim });
  };
  const mudarFim = (dataFim) => {
    if (!dataFim) return;
    onMudar({ dataInicio: dataFim < periodo.dataInicio ? dataFim : periodo.dataInicio, dataFim });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
      <div>
        <label htmlFor={`${id}-inicio`} className="text-xs text-snow/60 mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> Data inicial</label>
        <input id={`${id}-inicio`} type="date" value={periodo.dataInicio} onChange={(e) => mudarInicio(e.target.value)} className={classeCampo} />
      </div>
      <div>
        <label htmlFor={`${id}-fim`} className="text-xs text-snow/60 mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> Data final</label>
        <input id={`${id}-fim`} type="date" value={periodo.dataFim} onChange={(e) => mudarFim(e.target.value)} className={classeCampo} />
      </div>
      <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Períodos rápidos">
        {ATALHOS.map((atalho) => (
          <button
            key={atalho.id}
            type="button"
            onClick={() => onMudar(periodoRapido(atalho.id))}
            aria-pressed={atalhoAtivo === atalho.id}
            className={`h-10 px-3 rounded-lg text-xs font-medium border transition-colors ${atalhoAtivo === atalho.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-onyx text-snow/70 border-transparent hover:border-pearl/30'}`}
          >
            {atalho.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
