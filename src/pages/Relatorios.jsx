import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, TrendingUp, Award, Users, PieChart as IconePizza } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import FiltroPeriodo from '@/components/FiltroPeriodo';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useMelhoresClientes, useProdutosMaisVendidos, useVendasPorCategoria, useVendasPorDia } from '@/api/relatorios';
import { useCoresGrafico } from '@/lib/useCoresGrafico';
import { exportarCsv } from '@/lib/exportarCsv';
import { periodoRapido } from '@/lib/datas';
import { formatCurrency, formatDate } from '@/lib/format';

const CORES_PIE = ['#339989', '#7DE2D1', '#2A7A6E', '#5CBBB0', '#9AE8DB'];

function TooltipGrafico({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-graphite border border-[rgba(125,226,209,0.20)] rounded-lg px-3 py-2 text-sm card-shadow">
      <p className="text-snow/60 mb-1">{label ?? payload[0]?.name}</p>
      {payload.map((p, i) => <p key={i} className="text-snow font-medium">{formatter ? formatter(p.value) : p.value}</p>)}
    </div>
  );
}

function Painel({ icone: Icone, titulo, descricao, onExportar, podeExportar, atraso = 0, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: atraso }} className="bg-graphite rounded-card p-6 card-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-snow flex items-center gap-2"><Icone size={18} className="text-pearl" /> {titulo}</h2>
          <p className="text-xs text-snow/50 mt-1">{descricao}</p>
        </div>
        {onExportar && (
          <button
            onClick={onExportar}
            disabled={!podeExportar}
            className="h-8 px-2.5 rounded-md text-xs font-medium text-pearl border border-pearl/30 hover:bg-pearl-muted transition-colors inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Exportar ${titulo} em CSV`}
          >
            <Download size={13} /> CSV
          </button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function Ranking({ linhas, valor, rotuloValor, corBarra }) {
  if (!linhas.length) return <EmptyState message="Nenhuma venda no período" />;
  const maximo = Math.max(...linhas.map(valor)) || 1;
  return (
    <div className="space-y-3">
      {linhas.map((linha, i) => (
        <div key={linha.nome}>
          <div className="flex items-center justify-between text-sm mb-1 gap-2">
            <span className="text-snow flex items-center gap-2 min-w-0"><span className="text-pearl/60 font-mono text-xs w-5 shrink-0">{i + 1}º</span> <span className="truncate">{linha.nome}</span></span>
            <span className="text-snow/70 whitespace-nowrap">{rotuloValor(linha)}</span>
          </div>
          <div className="h-2 bg-onyx rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(valor(linha) / maximo) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className={`h-full rounded-full ${corBarra}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(() => periodoRapido('mes'));
  const cores = useCoresGrafico();
  const vendasPorDiaQuery = useVendasPorDia(periodo);
  const categoriasQuery = useVendasPorCategoria(periodo);
  const produtosQuery = useProdutosMaisVendidos(periodo, 5);
  const clientesQuery = useMelhoresClientes(periodo, 5);

  const vendasPorDia = vendasPorDiaQuery.data ?? [];
  const totalPeriodo = vendasPorDia.reduce((soma, dia) => soma + dia.vendas, 0);
  const sufixo = `${periodo.dataInicio}-a-${periodo.dataFim}`;

  const exportarVendasPorDia = () => exportarCsv(
    `vendas-por-dia-${sufixo}.csv`,
    [{ titulo: 'Data', campo: 'data' }, { titulo: 'Faturamento (R$)', campo: 'vendas' }],
    vendasPorDia.map((d) => ({ ...d, data: formatDate(d.data) })),
  );
  const exportarCategorias = () => exportarCsv(
    `vendas-por-categoria-${sufixo}.csv`,
    [{ titulo: 'Categoria', campo: 'nome' }, { titulo: 'Faturamento (R$)', campo: 'valor' }],
    categoriasQuery.data ?? [],
  );
  const exportarProdutos = () => exportarCsv(
    `produtos-mais-vendidos-${sufixo}.csv`,
    [{ titulo: 'Produto', campo: 'nome' }, { titulo: 'Unidades', campo: 'vendas' }, { titulo: 'Receita (R$)', campo: 'receita' }],
    produtosQuery.data ?? [],
  );
  const exportarClientes = () => exportarCsv(
    `melhores-clientes-${sufixo}.csv`,
    [{ titulo: 'Cliente', campo: 'nome' }, { titulo: 'Compras', campo: 'compras' }, { titulo: 'Total (R$)', campo: 'total' }],
    clientesQuery.data ?? [],
  );

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Análise de desempenho e exportações">
        <button
          onClick={exportarVendasPorDia}
          disabled={!vendasPorDia.length}
          className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={18} /> Exportar CSV
        </button>
      </PageHeader>

      <div className="bg-graphite rounded-card p-4 card-shadow mb-6 flex flex-col lg:flex-row lg:items-end gap-4">
        <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} id="rel" />
        <div className="lg:ml-auto lg:text-right">
          <p className="text-xs text-snow/50">Faturamento no período</p>
          <p className="text-xl font-semibold text-pearl">{vendasPorDiaQuery.isPending ? '...' : formatCurrency(totalPeriodo)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Painel icone={TrendingUp} titulo="Vendas por Período" descricao="Faturamento diário (vendas concluídas)">
          <div className="h-64">
            <EstadoConsulta consulta={vendasPorDiaQuery}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasPorDia} margin={{ left: -10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cores.grade} vertical={false} />
                  <XAxis dataKey="dia" stroke={cores.eixo} fontSize={11} tickLine={false} axisLine={false} minTickGap={12} />
                  <YAxis stroke={cores.eixo} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipGrafico formatter={formatCurrency} />} cursor={{ fill: cores.cursor }} />
                  <Bar dataKey="vendas" fill="#339989" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </EstadoConsulta>
          </div>
        </Painel>

        <Painel icone={IconePizza} titulo="Vendas por Categoria" descricao="Distribuição da receita" onExportar={exportarCategorias} podeExportar={Boolean(categoriasQuery.data?.length)} atraso={0.05}>
          <div className="h-64">
            <EstadoConsulta consulta={categoriasQuery}>
              {categoriasQuery.data?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoriasQuery.data} dataKey="valor" nameKey="nome" cx="50%" cy="45%" outerRadius={85} paddingAngle={3}>
                      {categoriasQuery.data.map((categoria, i) => <Cell key={categoria.nome} fill={CORES_PIE[i % CORES_PIE.length]} stroke={cores.bordaFatia} strokeWidth={2} />)}
                    </Pie>
                    <Tooltip content={<TooltipGrafico formatter={formatCurrency} />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: cores.legenda }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState message="Nenhuma venda no período" />}
            </EstadoConsulta>
          </div>
        </Painel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Painel icone={Award} titulo="Produtos Mais Vendidos" descricao="Por unidades vendidas" onExportar={exportarProdutos} podeExportar={Boolean(produtosQuery.data?.length)}>
          <EstadoConsulta consulta={produtosQuery}>
            <Ranking linhas={produtosQuery.data ?? []} valor={(p) => p.vendas} rotuloValor={(p) => `${p.vendas} un · ${formatCurrency(p.receita)}`} corBarra="bg-verdigris" />
          </EstadoConsulta>
        </Painel>

        <Painel icone={Users} titulo="Melhores Clientes" descricao="Por valor comprado" onExportar={exportarClientes} podeExportar={Boolean(clientesQuery.data?.length)} atraso={0.05}>
          <EstadoConsulta consulta={clientesQuery}>
            <Ranking linhas={clientesQuery.data ?? []} valor={(c) => c.total} rotuloValor={(c) => `${c.compras} compras · ${formatCurrency(c.total)}`} corBarra="bg-pearl" />
          </EstadoConsulta>
        </Painel>
      </div>
    </div>
  );
}
