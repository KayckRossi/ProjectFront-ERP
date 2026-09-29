import { useState, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { produtos, categorias } from '@/lib/mockData';

const nomeCategoria = (id) => categorias.find(c => c.id === id)?.nome || categorias.find(c => c.id === id)?.name || '—';

function statusEstoque(p) {
  const estoque = p.estoque ?? p.stock ?? 0;
  const estoqueMin = p.estoqueMinimo ?? p.minStock ?? 0;
  if (estoque === 0) return 'Sem Estoque';
  if (estoque < estoqueMin) return 'Crítico';
  if (estoque < estoqueMin * 1.5) return 'Baixo';
  return 'OK';
}

const FILTROS = [
  { id: 'all', label: 'Todos' },
  { id: 'low', label: 'Estoque Baixo' },
  { id: 'none', label: 'Sem Estoque' },
];

export default function Estoque() {
  const [filtro, setFiltro] = useState('all');

  const filtrados = useMemo(() => produtos.filter(p => {
    const estoque = p.estoque ?? p.stock ?? 0;
    const estoqueMin = p.estoqueMinimo ?? p.minStock ?? 0;
    if (filtro === 'all') return true;
    if (filtro === 'low') return estoque > 0 && estoque < estoqueMin * 1.5;
    if (filtro === 'none') return estoque === 0;
    return true;
  }), [filtro]);

  const contagens = {
    all: produtos.length,
    low: produtos.filter(p => {
      const e = p.estoque ?? p.stock ?? 0;
      const m = p.estoqueMinimo ?? p.minStock ?? 0;
      return e > 0 && e < m * 1.5;
    }).length,
    none: produtos.filter(p => (p.estoque ?? p.stock ?? 0) === 0).length,
  };

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Controle de quantidades e status de reposição" />

      <div className="flex gap-2 mb-4">
        {FILTROS.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-4 h-9 rounded-lg text-sm font-medium border transition-colors ${filtro === f.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
          >
            {f.label} <span className="ml-1.5 text-xs opacity-70">({contagens[f.id]})</span>
          </button>
        ))}
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        {filtrados.length === 0 ? <EmptyState message="Nenhum produto neste filtro" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                  <th className="font-medium py-3 px-4">Produto</th>
                  <th className="font-medium py-3 px-4">SKU</th>
                  <th className="font-medium py-3 px-4">Categoria</th>
                  <th className="font-medium py-3 px-4 text-center">Estoque Atual</th>
                  <th className="font-medium py-3 px-4 text-center">Estoque Mínimo</th>
                  <th className="font-medium py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => {
                  const nome = p.nome || p.name;
                  const cat = p.categoria || p.category;
                  const estoque = p.estoque ?? p.stock ?? 0;
                  const estoqueMin = p.estoqueMinimo ?? p.minStock ?? 0;
                  const status = statusEstoque(p);

                  return (
                    <tr key={p.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                      <td className="py-3 px-4 font-medium text-snow">{nome}</td>
                      <td className="py-3 px-4 font-mono text-snow/70">{p.sku}</td>
                      <td className="py-3 px-4 text-snow/70">{nomeCategoria(cat)}</td>
                      <td className="py-3 px-4 text-center font-semibold text-pearl">{estoque}</td>
                      <td className="py-3 px-4 text-center text-snow/60">{estoqueMin}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
