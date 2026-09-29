import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, TrendingUp, Award, Users } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { vendasPorDia, produtosMaisVendidos, melhoresClientes, vendasPorCategoria } from '@/lib/mockData';
import { formatCurrency } from '@/lib/format';

const CORES_PIE = ['#339989', '#7DE2D1', '#2A7A6E', '#5CBBB0', '#9AE8DB'];

function TooltipGrafico({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-graphite border border-[rgba(125,226,209,0.20)] rounded-lg px-3 py-2 text-sm card-shadow">
      <p className="text-snow/60 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="text-snow font-medium">{formatter ? formatter(p.value) : p.value}</p>)}
    </div>
  );
}

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState('2026-09-01');
  const [dataFim, setDataFim] = useState('2026-09-29');

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Análise de desempenho e exportações">
        <button className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Download size={18} /> Exportar
        </button>
      </PageHeader>

      {/* Filtro de Período */}
      <div className="bg-graphite rounded-card p-4 card-shadow mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label className="text-xs text-snow/60 mb-1.5 block flex items-center gap-1.5"><Calendar size={13} /> Data inicial</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-snow/60 mb-1.5 block flex items-center gap-1.5"><Calendar size={13} /> Data final</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-graphite rounded-card p-6 card-shadow">
          <h2 className="font-semibold text-snow mb-1 flex items-center gap-2"><TrendingUp size={18} className="text-pearl" /> Vendas por Período</h2>
          <p className="text-xs text-snow/50 mb-4">Faturamento diário</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasPorDia} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,226,209,0.08)" vertical={false} />
                <XAxis dataKey="dia" stroke="#FFFAFB66" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#FFFAFB66" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip content={<TooltipGrafico formatter={formatCurrency} />} cursor={{ fill: 'rgba(125,226,209,0.05)' }} />
                <Bar dataKey="vendas" fill="#339989" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-graphite rounded-card p-6 card-shadow">
          <h2 className="font-semibold text-snow mb-1 flex items-center gap-2"><Award size={18} className="text-pearl" /> Vendas por Categoria</h2>
          <p className="text-xs text-snow/50 mb-4">Distribuição de receita</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vendasPorCategoria} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                  {vendasPorCategoria.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} stroke="#2B2C28" strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<TooltipGrafico formatter={formatCurrency} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-graphite rounded-card p-6 card-shadow">
          <h2 className="font-semibold text-snow mb-4 flex items-center gap-2"><Award size={18} className="text-pearl" /> Produtos Mais Vendidos</h2>
          <div className="space-y-3">
            {produtosMaisVendidos.map((p, i) => {
              const max = produtosMaisVendidos[0].vendas;
              const nome = p.nome || p.name;
              return (
                <div key={nome}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-snow flex items-center gap-2"><span className="text-pearl/60 font-mono text-xs w-5">{i + 1}º</span> {nome}</span>
                    <span className="text-snow/70">{p.vendas} un</span>
                  </div>
                  <div className="h-2 bg-onyx rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.vendas / max) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full bg-verdigris"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-graphite rounded-card p-6 card-shadow">
          <h2 className="font-semibold text-snow mb-4 flex items-center gap-2"><Users size={18} className="text-pearl" /> Melhores Clientes</h2>
          <div className="space-y-3">
            {melhoresClientes.map((c, i) => {
              const max = melhoresClientes[0].total;
              const nome = c.nome || c.name;
              return (
                <div key={nome}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-snow flex items-center gap-2"><span className="text-pearl/60 font-mono text-xs w-5">{i + 1}º</span> {nome}</span>
                    <span className="text-pearl font-medium">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="h-2 bg-onyx rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.total / max) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full bg-pearl"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
