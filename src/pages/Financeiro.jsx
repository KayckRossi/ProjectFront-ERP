import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, Download, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { financeiroMensal } from '@/lib/mockData';
import { useErpData, dataLocalISO } from '@/lib/ErpDataContext';
import { useCoresGrafico } from '@/lib/useCoresGrafico';
import { exportarCsv } from '@/lib/exportarCsv';
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

const CATEGORIAS_SAIDA = ['Fornecedores', 'Fixos', 'Pessoal', 'Impostos', 'Outros'];
const CATEGORIAS_ENTRADA = ['Vendas', 'Serviços', 'Outros'];

function ModalTransacao({ onClose, onSave }) {
  const [form, setForm] = useState({ tipo: 'saida', descricao: '', valor: '', categoria: CATEGORIAS_SAIDA[0], data: dataLocalISO() });
  const [erro, setErro] = useState('');
  const categorias = form.tipo === 'saida' ? CATEGORIAS_SAIDA : CATEGORIAS_ENTRADA;
  const alterar = (campo, valor) => { setErro(''); setForm(f => ({ ...f, [campo]: valor })); };

  const submit = (e) => {
    e.preventDefault();
    const valor = parseFloat(String(form.valor).replace(',', '.'));
    if (!form.descricao.trim()) return setErro('Informe a descrição.');
    if (!(valor > 0)) return setErro('Informe um valor maior que zero.');
    onSave({ ...form, descricao: form.descricao.trim(), valor });
  };

  const classeCampo = 'w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-graphite rounded-modal p-6 w-full max-w-md card-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-snow">Nova movimentação</h2>
          <button onClick={onClose} className="text-snow/50 hover:text-snow" aria-label="Fechar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'saida', label: 'Saída' }, { id: 'entrada', label: 'Entrada' }].map(t => (
              <button
                key={t.id}
                type="button"
                aria-pressed={form.tipo === t.id}
                onClick={() => setForm(f => ({ ...f, tipo: t.id, categoria: (t.id === 'saida' ? CATEGORIAS_SAIDA : CATEGORIAS_ENTRADA)[0] }))}
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
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" className="flex-1 h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold">Salvar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Financeiro() {
  const { transacoes, adicionarTransacao } = useErpData();
  const cores = useCoresGrafico();
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [modalAberto, setModalAberto] = useState(false);

  const totalReceitas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((s, t) => s + (t.valor ?? 0), 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((s, t) => s + (t.valor ?? 0), 0);

  const lucroLiquido = totalReceitas - totalDespesas;

  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter(t => filtroTipo === 'all' || t.tipo === filtroTipo)
      .sort((a, b) => String(b.data).localeCompare(String(a.data)));
  }, [transacoes, filtroTipo]);

  const exportar = () => exportarCsv(
    `movimentacoes-${dataLocalISO()}.csv`,
    [
      { titulo: 'Data', campo: 'data' },
      { titulo: 'Descrição', campo: 'descricao' },
      { titulo: 'Categoria', campo: 'categoria' },
      { titulo: 'Tipo', campo: 'tipo' },
      { titulo: 'Valor', campo: 'valor' },
    ],
    transacoesFiltradas.map(t => ({ ...t, data: formatDate(t.data), tipo: t.tipo === 'entrada' ? 'Entrada' : 'Saída' })),
  );

  const cartoesKpi = [
    { icon: TrendingUp, label: 'Receitas', value: totalReceitas, color: '#7DE2D1' },
    { icon: TrendingDown, label: 'Despesas', value: totalDespesas, color: '#E63946' },
    { icon: Wallet, label: 'Lucro Líquido', value: lucroLiquido, color: '#339989' },
  ];

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Receitas, despesas e fluxo de caixa">
        <button onClick={exportar} className="h-10 px-4 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors flex items-center gap-2">
          <Download size={18} /> Exportar CSV
        </button>
        <button onClick={() => setModalAberto(true)} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Nova movimentação
        </button>
      </PageHeader>

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
              <CartesianGrid strokeDasharray="3 3" stroke={cores.grade} vertical={false} />
              <XAxis dataKey="mes" stroke={cores.eixo} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={cores.eixo} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip content={<TooltipGrafico />} cursor={{ fill: cores.cursor }} />
              <Legend wrapperStyle={{ fontSize: 12, color: cores.legenda }} iconType="circle" />
              <Bar dataKey="receitas" name="Receitas" fill="#339989" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="despesas" name="Despesas" fill="#E63946" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 flex flex-wrap gap-3 items-center justify-between border-b border-[rgba(125,226,209,0.10)]">
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
                aria-pressed={filtroTipo === f.id}
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
                const { descricao: desc, categoria: cat, data, tipo, valor = 0 } = t;

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

      <AnimatePresence>
        {modalAberto && (
          <ModalTransacao
            onClose={() => setModalAberto(false)}
            onSave={(t) => { adicionarTransacao(t); setModalAberto(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
