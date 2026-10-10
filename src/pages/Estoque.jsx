import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDownUp, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { useErpData } from '@/lib/ErpDataContext';
import { statusEstoque, estoqueBaixo } from '@/lib/estoque';

const FILTROS = [
  { id: 'all', label: 'Todos' },
  { id: 'low', label: 'Estoque Baixo' },
  { id: 'none', label: 'Sem Estoque' },
];

function ModalMovimentacao({ produto, onClose, onConfirm }) {
  const [tipo, setTipo] = useState('entrada');
  const [quantidade, setQuantidade] = useState('');
  const qtd = parseInt(quantidade, 10) || 0;
  const invalido = qtd <= 0 || (tipo === 'saida' && qtd > produto.estoque);

  const submit = (e) => {
    e.preventDefault();
    if (!invalido) onConfirm(tipo === 'entrada' ? qtd : -qtd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-graphite rounded-modal p-6 w-full max-w-sm card-shadow">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-snow">Movimentar estoque</h2>
          <button onClick={onClose} className="text-snow/50 hover:text-snow" aria-label="Fechar"><X size={20} /></button>
        </div>
        <p className="text-sm text-snow/50 mb-5">{produto.nome} · atual: <span className="text-pearl font-medium">{produto.estoque} un</span></p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'entrada', label: 'Entrada' }, { id: 'saida', label: 'Saída / Perda' }].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                aria-pressed={tipo === t.id}
                className={`h-10 rounded-lg text-sm font-medium border transition-colors ${tipo === t.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-onyx text-snow/70 border-transparent hover:border-pearl/30'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="qtd-movimentacao" className="text-xs text-snow/60 mb-1.5 block">Quantidade</label>
            <input
              id="qtd-movimentacao"
              type="number"
              min="1"
              autoFocus
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
            />
            {tipo === 'saida' && qtd > produto.estoque && (
              <p role="alert" className="text-xs text-danger mt-1.5">Quantidade maior que o estoque atual.</p>
            )}
          </div>
          <button type="submit" disabled={invalido} className="w-full h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            Confirmar
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function Estoque() {
  const { toast } = useToast();
  const { produtos, categorias, ajustarEstoque } = useErpData();
  const [filtro, setFiltro] = useState('all');
  const [busca, setBusca] = useState('');
  const [movimentando, setMovimentando] = useState(null);

  const nomeCategoria = (id) => categorias.find(c => c.id === id)?.nome || '—';

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter(p => {
      if (termo && !p.nome.toLowerCase().includes(termo) && !(p.sku || '').toLowerCase().includes(termo)) return false;
      if (filtro === 'low') return estoqueBaixo(p);
      if (filtro === 'none') return (p.estoque ?? 0) === 0;
      return true;
    });
  }, [produtos, filtro, busca]);

  const contagens = {
    all: produtos.length,
    low: produtos.filter(estoqueBaixo).length,
    none: produtos.filter(p => (p.estoque ?? 0) === 0).length,
  };

  const confirmarMovimentacao = (delta) => {
    ajustarEstoque(movimentando.id, delta);
    toast({
      title: delta > 0 ? 'Entrada registrada' : 'Saída registrada',
      description: `${movimentando.nome}: ${delta > 0 ? '+' : ''}${delta} un.`,
    });
    setMovimentando(null);
  };

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Controle de quantidades e status de reposição" />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {FILTROS.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`px-4 h-9 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${filtro === f.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
            >
              {f.label} <span className="ml-1.5 text-xs opacity-70">({contagens[f.id]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 md:max-w-xs md:ml-auto">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            aria-label="Buscar no estoque"
            className="w-full h-9 bg-graphite text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        {filtrados.length === 0 ? <EmptyState message="Nenhum produto neste filtro" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                  <th scope="col" className="font-medium py-3 px-4">Produto</th>
                  <th scope="col" className="font-medium py-3 px-4">SKU</th>
                  <th scope="col" className="font-medium py-3 px-4">Categoria</th>
                  <th scope="col" className="font-medium py-3 px-4 text-center">Estoque Atual</th>
                  <th scope="col" className="font-medium py-3 px-4 text-center">Estoque Mínimo</th>
                  <th scope="col" className="font-medium py-3 px-4 text-center">Status</th>
                  <th scope="col" className="font-medium py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                    <td className="py-3 px-4 font-medium text-snow">{p.nome}</td>
                    <td className="py-3 px-4 font-mono text-snow/70">{p.sku}</td>
                    <td className="py-3 px-4 text-snow/70">{nomeCategoria(p.categoria)}</td>
                    <td className="py-3 px-4 text-center font-semibold text-pearl">{p.estoque ?? 0}</td>
                    <td className="py-3 px-4 text-center text-snow/60">{p.estoqueMinimo ?? 0}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={statusEstoque(p)} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setMovimentando(p)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-pearl border border-pearl/30 hover:bg-pearl-muted transition-colors"
                        aria-label={`Movimentar estoque de ${p.nome}`}
                      >
                        <ArrowDownUp size={14} /> Movimentar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {movimentando && (
          <ModalMovimentacao
            key={movimentando.id}
            produto={movimentando}
            onClose={() => setMovimentando(null)}
            onConfirm={confirmarMovimentacao}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
