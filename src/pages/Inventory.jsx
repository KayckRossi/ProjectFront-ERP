import { useState, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { products, categories } from '@/lib/mockData';

const catName = (id) => categories.find(c => c.id === id)?.name || '—';

function stockStatus(p) {
  if (p.stock === 0) return 'Sem Estoque';
  if (p.stock < p.minStock) return 'Crítico';
  if (p.stock < p.minStock * 1.5) return 'Baixo';
  return 'OK';
}

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'low', label: 'Estoque Baixo' },
  { id: 'none', label: 'Sem Estoque' },
];

export default function Inventory() {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'low') return p.stock > 0 && p.stock < p.minStock * 1.5;
    if (filter === 'none') return p.stock === 0;
    return true;
  }), [filter]);

  const counts = {
    all: products.length,
    low: products.filter(p => p.stock > 0 && p.stock < p.minStock * 1.5).length,
    none: products.filter(p => p.stock === 0).length,
  };

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Controle de quantidades e status de reposição" />

      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 h-9 rounded-lg text-sm font-medium border transition-colors ${filter === f.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
          >
            {f.label} <span className="ml-1.5 text-xs opacity-70">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        {filtered.length === 0 ? <EmptyState message="Nenhum produto neste filtro" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                  <th className="font-medium py-3 px-4">Produto</th>
                  <th className="font-medium py-3 px-4">SKU</th>
                  <th className="font-medium py-3 px-4">Categoria</th>
                  <th className="font-medium py-3 px-4">Quantidade</th>
                  <th className="font-medium py-3 px-4">Mínimo</th>
                  <th className="font-medium py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const status = stockStatus(p);
                  return (
                    <tr key={p.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                      <td className="py-3 px-4 text-snow font-medium">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-snow/70">{p.sku}</td>
                      <td className="py-3 px-4 text-snow/70">{catName(p.category)}</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${p.stock === 0 ? 'text-danger' : p.stock < p.minStock ? 'text-warning' : 'text-snow'}`}>{p.stock}</span>
                      </td>
                      <td className="py-3 px-4 text-snow/50">{p.minStock}</td>
                      <td className="py-3 px-4"><StatusBadge status={status} /></td>
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
