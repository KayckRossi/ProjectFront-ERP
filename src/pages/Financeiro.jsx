import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { transacoes, financeiroMensal } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/format';

function TooltipGrafico({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-graphite border border-[rgba(125,226,209,0.20)] rounded-lg px-3 py-2 text-sm card-shadow">
      <p className="text-snow/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color || p.fill }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export default function Financeiro() {
  const [filtroTipo, setFiltroTipo] = useState('all');

  const totalReceitas = transacoes
    .filter(t => (t.tipo || t.type) === 'entrada')
    .reduce((s, t) => s + (t.valor ?? t.amount ?? 0), 0);

  const totalDespesas = transacoes
    .filter(t => (t.tipo || t.type) === 'saida')
    .reduce((s, t) => s + (t.valor ?? t.amount ?? 0), 0);

  const lucroLiquido = totalReceitas - totalDespesas;

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter(t => {
      const tipo = t.tipo || t.type;
      return filtroTipo === 'all' || tipo === filtroTipo;
    });
  }, [filtroTipo]);

  const cartoesKpi = [
    { icon: TrendingUp, label: 'Receitas', value: totalReceitas, color: '#7DE2D1' },
    { icon: TrendingDown, label: 'Despesas', value: totalDespesas, color: '#E63946' },
    { icon: Wallet, label: 'Lucro Líquido', value: lucroLiquido, color: '#339989' },
  ];

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Receitas, despesas e fluxo de caixa" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {cartoesKpi.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-graphite rounded-card p-6 card-shadow border-l-4"
              style={{ borderLeftColor: c.color }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-snow/50">{c.label}</p>
                  <p className="text-2xl font-semibold text-snow mt-2">{formatCurrency(c.value)}</p>
                </div>
                <div className="w-11 h-11 rounded-lg bg-verdigris-light flex items-center justify-center">
                  <Icon size={22} style={{ color: c.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-graphite rounded-card p-6 card-shadow mb-6">
        <h2 className="font-semibold text-snow mb-4">Receitas x Despesas</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financeiroMensal} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,226,209,0.08)" vertical={false} />
              <XAxis dataKey="mes" stroke="#FFFAFB66" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#FFFAFB66" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip content={<TooltipGrafico />} cursor={{ fill: 'rgba(125,226,209,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#FFFAFB99' }} iconType="circle" />
              <Bar dataKey="receitas" name="Receitas" fill="#339989" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="despesas" name="Despesas" fill="#E63946" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-[rgba(125,226,209,0.10)]">
          <h2 className="font-semibold text-snow">Movimentações</h2>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'entrada', label: 'Entradas' },
              { id: 'saida', label: 'Saídas' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                className={`px-3 h-8 rounded-lg text-xs font-medium border transition-colors ${filtroTipo === f.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-onyx text-snow/70 border-transparent hover:border-pearl/30'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                <th className="font-medium py-3 px-4">Descrição</th>
                <th className="font-medium py-3 px-4">Categoria</th>
                <th className="font-medium py-3 px-4">Data</th>
                <th className="font-medium py-3 px-4">Tipo</th>
                <th className="font-medium py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.map(t => {
                const desc = t.descricao || t.description;
                const cat = t.categoria || t.category;
                const data = t.data || t.date;
                const tipo = t.tipo || t.type;
                const valor = t.valor ?? t.amount ?? 0;

                return (
                  <tr key={t.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                    <td className="py-3 px-4 text-snow">{desc}</td>
                    <td className="py-3 px-4 text-snow/70">{cat}</td>
                    <td className="py-3 px-4 text-snow/70">{formatDate(data)}</td>
                    <td className="py-3 px-4"><StatusBadge status={tipo} /></td>
                    <td className={`py-3 px-4 text-right font-medium ${tipo === 'entrada' ? 'text-pearl' : 'text-danger'}`}>
                      {tipo === 'entrada' ? '+' : '-'}{formatCurrency(valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
