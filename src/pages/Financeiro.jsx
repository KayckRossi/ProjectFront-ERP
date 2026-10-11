import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import FiltroPeriodo from '@/components/FiltroPeriodo';
import Paginacao from '@/components/Paginacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { usePaginacao } from '@/hooks/usePaginacao';
import { CATEGORIAS_TRANSACAO, useCriarTransacao, useFinanceiroMensal, useTransacoes } from '@/api/financeiro';
import { useCoresGrafico } from '@/lib/useCoresGrafico';
import { exportarCsv } from '@/lib/exportarCsv';
import { dataLocalISO, periodoRapido } from '@/lib/datas';
import { arredondar, lerValorMonetario } from '@/lib/dinheiro';
import { formatCurrency, formatDate } from '@/lib/format';

const POR_PAGINA = 15;

const FILTROS_TIPO = [
  { id: 'all', label: 'Todas' },
  { id: 'entrada', label: 'Entradas' },
  { id: 'saida', label: 'Saídas' },
];

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

function ModalTransacao({ onClose, onSave }) {
  const [form, setForm] = useState({ tipo: 'saida', descricao: '', valor: '', categoria: CATEGORIAS_TRANSACAO.saida[0], data: dataLocalISO() });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const categorias = CATEGORIAS_TRANSACAO[form.tipo];
  const alterar = (campo, valor) => { setErro(''); setForm((f) => ({ ...f, [campo]: valor })); };

  const submit = async (e) => {
    e.preventDefault();
    const valor = lerValorMonetario(form.valor);
    if (!form.descricao.trim()) return setErro('Informe a descrição.');
    if (!(valor > 0)) return setErro('Informe um valor maior que zero.');
    setSalvando(true);
    try {
      await onSave({ ...form, descricao: form.descricao.trim(), valor });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  const classeCampo = 'w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

  return (
    <Modal titulo="Nova movimentação" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'saida', label: 'Saída' }, { id: 'entrada', label: 'Entrada' }].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={form.tipo === t.id}
              onClick={() => setForm((f) => ({ ...f, tipo: t.id, categoria: CATEGORIAS_TRANSACAO[t.id][0] }))}
              className={`h-10 rounded-lg text-sm font-medium border transition-colors ${form.tipo === t.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-onyx text-snow/70 border-transparent hover:border-pearl/30'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="tr-descricao" className="text-xs text-snow/60 mb-1.5 block">Descrição</label>
          <input id="tr-descricao" autoFocus value={form.descricao} onChange={(e) => alterar('descricao', e.target.value)} className={classeCampo} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tr-valor" className="text-xs text-snow/60 mb-1.5 block">Valor (R$)</label>
            <input id="tr-valor" inputMode="decimal" placeholder="0,00" value={form.valor} onChange={(e) => alterar('valor', e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="tr-data" className="text-xs text-snow/60 mb-1.5 block">Data</label>
            <input id="tr-data" type="date" value={form.data} onChange={(e) => alterar('data', e.target.value)} className={classeCampo} />
          </div>
        </div>
        <div>
          <label htmlFor="tr-categoria" className="text-xs text-snow/60 mb-1.5 block">Categoria</label>
          <select id="tr-categoria" value={form.categoria} onChange={(e) => alterar('categoria', e.target.value)} className={classeCampo}>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={salvando} className="flex-1 h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Financeiro() {
  const { toast } = useToast();
  const cores = useCoresGrafico();
  const [periodo, setPeriodo] = useState(() => periodoRapido('mes'));
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [modalAberto, setModalAberto] = useState(false);
  const transacoesQuery = useTransacoes(periodo);
  const mensalQuery = useFinanceiroMensal(6);
  const criarTransacao = useCriarTransacao();

  const transacoes = useMemo(() => transacoesQuery.data ?? [], [transacoesQuery.data]);
  const somarTipo = (tipo) => arredondar(transacoes.filter((t) => t.tipo === tipo).reduce((s, t) => s + t.valor, 0));
  const totalReceitas = somarTipo('entrada');
  const totalDespesas = somarTipo('saida');
  const saldo = arredondar(totalReceitas - totalDespesas);

  const filtradas = useMemo(
    () => transacoes.filter((t) => filtroTipo === 'all' || t.tipo === filtroTipo),
    [transacoes, filtroTipo],
  );
  const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(filtradas, POR_PAGINA, `${periodo.dataInicio}|${periodo.dataFim}|${filtroTipo}`);

  const cartoesKpi = [
    { icon: TrendingUp, label: 'Receitas no período', value: totalReceitas, color: '#7DE2D1' },
    { icon: TrendingDown, label: 'Despesas no período', value: totalDespesas, color: '#E63946' },
    { icon: Wallet, label: 'Saldo do período', value: saldo, color: saldo < 0 ? '#E63946' : '#339989' },
  ];

  const exportar = () => exportarCsv(
    `movimentacoes-${periodo.dataInicio}-a-${periodo.dataFim}.csv`,
    [
      { titulo: 'Data', campo: 'data' },
      { titulo: 'Descrição', campo: 'descricao' },
      { titulo: 'Categoria', campo: 'categoria' },
      { titulo: 'Tipo', campo: 'tipo' },
      { titulo: 'Valor', campo: 'valor' },
    ],
    filtradas.map((t) => ({ ...t, data: formatDate(t.data), tipo: t.tipo === 'entrada' ? 'Entrada' : 'Saída' })),
  );

  const salvar = async (transacao) => {
    await criarTransacao.mutateAsync(transacao);
    toast({ title: 'Movimentação lançada', description: transacao.descricao });
    setModalAberto(false);
  };

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Receitas, despesas e fluxo de caixa">
        <button onClick={exportar} disabled={!filtradas.length} className="h-10 px-4 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <Download size={18} /> Exportar CSV
        </button>
        <button onClick={() => setModalAberto(true)} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Nova movimentação
        </button>
      </PageHeader>

      <div className="bg-graphite rounded-card p-4 card-shadow mb-6">
        <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} id="financeiro" />
      </div>

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
                  <p className="text-2xl font-semibold text-snow mt-2">{transacoesQuery.isPending ? '...' : formatCurrency(c.value)}</p>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-snow">Receitas x Despesas</h2>
          <span className="text-xs text-pearl bg-verdigris-light px-2 py-1 rounded-full">Últimos 6 meses</span>
        </div>
        <div className="h-72">
          <EstadoConsulta consulta={mensalQuery}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mensalQuery.data} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={cores.grade} vertical={false} />
                <XAxis dataKey="mes" stroke={cores.eixo} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={cores.eixo} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<TooltipGrafico />} cursor={{ fill: cores.cursor }} />
                <Legend wrapperStyle={{ fontSize: 12, color: cores.legenda }} iconType="circle" />
                <Bar dataKey="receitas" name="Receitas" fill="#339989" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="despesas" name="Despesas" fill="#E63946" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </EstadoConsulta>
        </div>
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(125,226,209,0.10)]">
          <h2 className="font-semibold text-snow">Movimentações</h2>
          <div className="flex gap-2">
            {FILTROS_TIPO.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                aria-pressed={filtroTipo === f.id}
                className={`px-3 h-8 rounded-lg text-xs font-medium border transition-colors ${filtroTipo === f.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-onyx text-snow/70 border-transparent hover:border-pearl/30'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <EstadoConsulta consulta={transacoesQuery} textoCarregando="Carregando movimentações...">
          {filtradas.length === 0 ? <EmptyState message="Nenhuma movimentação neste período" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Descrição</th>
                    <th scope="col" className="font-medium py-3 px-4">Categoria</th>
                    <th scope="col" className="font-medium py-3 px-4">Data</th>
                    <th scope="col" className="font-medium py-3 px-4">Tipo</th>
                    <th scope="col" className="font-medium py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((t) => (
                    <tr key={t.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                      <td className="py-3 px-4 text-snow">
                        {t.vendaId ? (
                          <Link to={`/vendas?venda=${encodeURIComponent(t.vendaId)}`} className="hover:text-pearl hover:underline">{t.descricao}</Link>
                        ) : t.compraId ? (
                          <Link to={`/backoffice/compras?compra=${encodeURIComponent(t.compraId)}`} className="hover:text-pearl hover:underline">{t.descricao}</Link>
                        ) : t.descricao}
                      </td>
                      <td className="py-3 px-4 text-snow/70">{t.categoria}</td>
                      <td className="py-3 px-4 text-snow/70">{formatDate(t.data)}</td>
                      <td className="py-3 px-4"><StatusBadge status={t.tipo} /></td>
                      <td className={`py-3 px-4 text-right font-medium ${t.tipo === 'entrada' ? 'text-pearl' : 'text-danger'}`}>
                        {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} totalItens={filtradas.length} rotulo="movimentações" />
        </EstadoConsulta>
      </div>

      <AnimatePresence>
        {modalAberto && <ModalTransacao onClose={() => setModalAberto(false)} onSave={salvar} />}
      </AnimatePresence>
    </div>
  );
}
