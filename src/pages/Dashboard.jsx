import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { EstadoConsulta, ErroConsulta } from '@/components/EstadoConsulta';
import { useKpisDashboard, useVendasPorCategoria, useVendasPorDia } from '@/api/relatorios';
import { useVendasRecentes } from '@/api/vendas';
import { useConfiguracoes } from '@/api/configuracoes';
import { useCoresGrafico } from '@/lib/useCoresGrafico';
import { dataLocalISO, periodoRapido, somarDias } from '@/lib/datas';
import { formatCurrency, formatDateTime } from '@/lib/format';

const CORES_PIE = ['#339989', '#7DE2D1', '#2A7A6E', '#5CBBB0', '#9AE8DB'];

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-graphite border border-[rgba(125,226,209,0.20)] rounded-lg px-3 py-2 text-sm card-shadow">
      <p className="text-snow/60 mb-1">{label ?? payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-snow font-medium">{formatter ? formatter(p.value) : p.value}</p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { eixo: axisColor, grade: gridColor, bordaFatia: cellStroke, legenda: legendColor } = useCoresGrafico();
  const hoje = dataLocalISO();
  const kpisQuery = useKpisDashboard();
  const vendasPorDiaQuery = useVendasPorDia({ dataInicio: somarDias(hoje, -6), dataFim: hoje });
  const categoriasQuery = useVendasPorCategoria(periodoRapido('mes'));
  const recentesQuery = useVendasRecentes(6);
  const { data: configuracoes } = useConfiguracoes();

  const kpis = kpisQuery.data;
  const dataPorExtenso = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const nomeLoja = configuracoes?.loja?.nome;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Visão geral ${nomeLoja ? `de ${nomeLoja} ` : ''}em ${dataPorExtenso}`} />

      {/* KPIs */}
      {kpisQuery.isError ? (
        <div className="bg-graphite rounded-card card-shadow mb-6">
          <ErroConsulta erro={kpisQuery.error} onTentarNovamente={kpisQuery.refetch} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={DollarSign} label="Vendas Hoje" value={kpis?.vendasHoje} moeda detalhe={kpis && `${kpis.quantidadeVendasHoje} ${kpis.quantidadeVendasHoje === 1 ? 'venda concluída' : 'vendas concluídas'}`} />
          <KpiCard icon={ShoppingCart} label="Ticket Médio" value={kpis?.ticketMedio} moeda detalhe="Média das vendas de hoje" />
          <KpiCard icon={AlertTriangle} label="Produtos em Baixa" value={kpis?.produtosEmBaixa} detalhe="Sem estoque, crítico ou baixo" />
          <KpiCard icon={TrendingUp} label="Faturamento Mensal" value={kpis?.faturamentoMensal} moeda detalhe="Vendas concluídas no mês" />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-graphite rounded-card p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-snow">Vendas da Semana</h2>
            <span className="text-xs text-pearl bg-verdigris-light px-2 py-1 rounded-full">Últimos 7 dias</span>
          </div>
          <div className="h-72">
            <EstadoConsulta consulta={vendasPorDiaQuery}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vendasPorDiaQuery.data} margin={{ left: -10, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#339989" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#339989" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="dia" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                  <Area type="monotone" dataKey="vendas" stroke="#339989" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </EstadoConsulta>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-graphite rounded-card p-6 card-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-snow">Vendas por Categoria</h2>
            <span className="text-xs text-pearl bg-verdigris-light px-2 py-1 rounded-full">Este mês</span>
          </div>
          <div className="h-72">
            <EstadoConsulta consulta={categoriasQuery}>
              {categoriasQuery.data?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoriasQuery.data} dataKey="valor" nameKey="nome" cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {categoriasQuery.data.map((categoria, i) => (
                        <Cell key={categoria.nome} fill={CORES_PIE[i % CORES_PIE.length]} stroke={cellStroke} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState message="Nenhuma venda neste mês" />}
            </EstadoConsulta>
          </div>
        </motion.div>
      </div>

      {/* Vendas recentes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-graphite rounded-card p-6 card-shadow overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-snow">Últimas Vendas</h2>
          <button onClick={() => navigate('/vendas')} className="text-sm text-pearl hover:underline">Ver todas</button>
        </div>
        <EstadoConsulta consulta={recentesQuery}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Tabela de últimas vendas">
              <thead>
                <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                  <th scope="col" className="font-medium py-3 px-2">Código</th>
                  <th scope="col" className="font-medium py-3 px-2">Cliente</th>
                  <th scope="col" className="font-medium py-3 px-2">Itens</th>
                  <th scope="col" className="font-medium py-3 px-2">Data</th>
                  <th scope="col" className="font-medium py-3 px-2">Total</th>
                  <th scope="col" className="font-medium py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentesQuery.data ?? []).map((venda) => (
                  <tr
                    key={venda.id}
                    onClick={() => navigate(`/vendas?venda=${encodeURIComponent(venda.id)}`)}
                    className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-2 font-mono text-pearl">#{venda.numero}</td>
                    <td className="py-3 px-2 text-snow">{venda.cliente}</td>
                    <td className="py-3 px-2 text-snow/70">{venda.itens}</td>
                    <td className="py-3 px-2 text-snow/70">{formatDateTime(venda.data)}</td>
                    <td className="py-3 px-2 text-snow font-medium">{formatCurrency(venda.total)}</td>
                    <td className="py-3 px-2"><StatusBadge status={venda.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EstadoConsulta>
      </motion.div>
    </div>
  );
}
