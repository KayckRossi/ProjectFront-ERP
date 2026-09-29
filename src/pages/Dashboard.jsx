import { motion } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';
import { recentSales, salesByDay, salesByCategory } from '@/lib/mockData';
import { formatCurrency, formatDateTime } from '@/lib/format';

const PIE_COLORS = ['#339989', '#7DE2D1', '#2A7A6E', '#5CBBB0', '#9AE8DB'];

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-graphite border border-[rgba(125,226,209,0.20)] rounded-lg px-3 py-2 text-sm card-shadow">
      <p className="text-snow/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-snow font-medium">{formatter ? formatter(p.value) : p.value}</p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do seu negócio em 29 de setembro de 2026" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={DollarSign} label="Vendas Hoje" value={1870} prefix="R$ " />
        <KpiCard icon={ShoppingCart} label="Ticket Médio" value={62.30} prefix="R$ " />
        <KpiCard icon={AlertTriangle} label="Produtos em Baixa" value={4} />
        <KpiCard icon={TrendingUp} label="Faturamento Mensal" value={18300} prefix="R$ " />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-graphite rounded-card p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-snow">Vendas da Semana</h2>
            <span className="text-xs text-pearl bg-verdigris-light px-2 py-1 rounded-full">Últimos 8 dias</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#339989" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#339989" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,226,209,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#FFFAFB66" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#FFFAFB66" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                <Area type="monotone" dataKey="vendas" stroke="#339989" strokeWidth={2.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-graphite rounded-card p-6 card-shadow"
        >
          <h2 className="font-semibold text-snow mb-4">Vendas por Categoria</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {salesByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#2B2C28" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#FFFAFB99' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent sales */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-graphite rounded-card p-6 card-shadow overflow-hidden"
      >
        <h2 className="font-semibold text-snow mb-4">Últimas Vendas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                <th className="font-medium py-3 px-2">Código</th>
                <th className="font-medium py-3 px-2">Cliente</th>
                <th className="font-medium py-3 px-2">Itens</th>
                <th className="font-medium py-3 px-2">Data</th>
                <th className="font-medium py-3 px-2">Total</th>
                <th className="font-medium py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                  <td className="py-3 px-2 font-mono text-pearl">#{s.id}</td>
                  <td className="py-3 px-2 text-snow">{s.customer}</td>
                  <td className="py-3 px-2 text-snow/70">{s.items}</td>
                  <td className="py-3 px-2 text-snow/70">{formatDateTime(s.date)}</td>
                  <td className="py-3 px-2 text-snow font-medium">{formatCurrency(s.total)}</td>
                  <td className="py-3 px-2"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
