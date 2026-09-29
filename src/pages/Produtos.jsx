import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, X, Upload } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { produtos as produtosIniciais, categorias } from '@/lib/mockData';
import { formatCurrency } from '@/lib/format';

const nomeCategoria = (id) => categorias.find(c => c.id === id)?.nome || categorias.find(c => c.id === id)?.name || '—';

function ModalFormularioProduto({ open, onClose, onSave, editing }) {
  const [form, setForm] = useState(
    editing ? {
      nome: editing.nome || editing.name || '',
      sku: editing.sku || '',
      categoria: editing.categoria || editing.category || 'bebidas',
      custo: editing.custo ?? editing.cost ?? 0,
      preco: editing.preco ?? editing.price ?? 0,
      estoque: editing.estoque ?? editing.stock ?? 0,
      estoqueMinimo: editing.estoqueMinimo ?? editing.minStock ?? 0,
    } : {
      nome: '',
      sku: '',
      categoria: 'bebidas',
      custo: 0,
      preco: 0,
      estoque: 0,
      estoqueMinimo: 0,
    }
  );

  const margem = form.preco && form.custo ? (((form.preco - form.custo) / form.preco) * 100).toFixed(1) : '0.0';

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      name: form.nome,
      category: form.categoria,
      cost: form.custo,
      price: form.preco,
      stock: form.estoque,
      minStock: form.estoqueMinimo,
    });
  };

  const campo = (label, name, type = 'text', opts = {}) => (
    <div>
      <label className="text-xs text-snow/60 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
        className="w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
        {...opts}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-graphite rounded-modal p-6 w-full max-w-lg card-shadow max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-snow">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="text-snow/50 hover:text-snow" aria-label="Fechar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {campo('Nome', 'nome')}
            {campo('SKU', 'sku')}
            <div>
              <label className="text-xs text-snow/60 mb-1.5 block">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
              >
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome || c.name}</option>)}
              </select>
            </div>
            {campo('Estoque mínimo', 'estoqueMinimo', 'number')}
            {campo('Preço de custo (R$)', 'custo', 'number', { step: '0.01' })}
            {campo('Preço de venda (R$)', 'preco', 'number', { step: '0.01' })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-snow/60">Margem calculada:</span>
            <span className="text-pearl font-medium">{margem}%</span>
          </div>
          <div>
            <label className="text-xs text-snow/60 mb-1.5 block">Foto do produto</label>
            <div className="border-2 border-dashed border-[rgba(125,226,209,0.25)] rounded-lg p-6 text-center cursor-pointer hover:border-verdigris transition-colors">
              <Upload size={22} className="mx-auto text-pearl mb-2" />
              <p className="text-sm text-snow/60">Arraste uma imagem ou clique para enviar</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" className="flex-1 h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold">Salvar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Produtos() {
  const [itens, setItens] = useState(produtosIniciais);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const porPagina = 6;

  const filtrados = useMemo(() => itens.filter(p => {
    const cat = p.categoria || p.category;
    const nome = p.nome || p.name;
    const sku = p.sku || '';
    return (filtroCategoria === 'all' || cat === filtroCategoria) &&
      (nome.toLowerCase().includes(busca.toLowerCase()) || sku.toLowerCase().includes(busca.toLowerCase()));
  }), [itens, busca, filtroCategoria]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const itensPagina = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const abrirNovo = () => { setEditando(null); setModalAberto(true); };
  const abrirEdicao = (p) => { setEditando(p); setModalAberto(true); };
  const salvar = (form) => {
    if (editando) {
      setItens(prev => prev.map(p => p.id === editando.id ? { ...p, ...form } : p));
    } else {
      setItens(prev => [...prev, { ...form, id: `p${Date.now()}`, codigoBarras: '789' + Date.now(), barcode: '789' + Date.now() }]);
    }
    setModalAberto(false);
  };
  const excluir = (id) => { setItens(prev => prev.filter(p => p.id !== id)); setConfirmarExclusao(null); };

  return (
    <div>
      <PageHeader title="Produtos" subtitle="Cadastre e gerencie seu catálogo">
        <button onClick={abrirNovo} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Novo Produto
        </button>
      </PageHeader>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-[rgba(125,226,209,0.10)]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou SKU..."
              className="w-full h-10 bg-onyx text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm" />
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm">
            <option value="all">Todas categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome || c.name}</option>)}
          </select>
        </div>

        {itensPagina.length === 0 ? <EmptyState message="Nenhum produto corresponde à busca" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                  <th className="font-medium py-3 px-4">Produto</th>
                  <th className="font-medium py-3 px-4">SKU</th>
                  <th className="font-medium py-3 px-4">Categoria</th>
                  <th className="font-medium py-3 px-4">Custo</th>
                  <th className="font-medium py-3 px-4">Venda</th>
                  <th className="font-medium py-3 px-4">Margem</th>
                  <th className="font-medium py-3 px-4">Estoque</th>
                  <th className="font-medium py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensPagina.map(p => {
                  const nome = p.nome || p.name;
                  const custo = p.custo ?? p.cost ?? 0;
                  const preco = p.preco ?? p.price ?? 0;
                  const estoque = p.estoque ?? p.stock ?? 0;
                  const margem = preco ? (((preco - custo) / preco) * 100).toFixed(0) : '0';

                  return (
                    <tr key={p.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg gradient-pearl flex items-center justify-center text-pearl font-semibold shrink-0">{nome[0]}</div>
                          <span className="text-snow font-medium">{nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-snow/70">{p.sku}</td>
                      <td className="py-3 px-4 text-snow/70">{nomeCategoria(p.categoria || p.category)}</td>
                      <td className="py-3 px-4 text-snow/70">{formatCurrency(custo)}</td>
                      <td className="py-3 px-4 text-snow font-medium">{formatCurrency(preco)}</td>
                      <td className="py-3 px-4 text-pearl">{margem}%</td>
                      <td className="py-3 px-4 text-snow/70">{estoque}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => abrirEdicao(p)} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label="Editar"><Pencil size={15} /></button>
                          <button onClick={() => setConfirmarExclusao(p)} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors" aria-label="Excluir"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[rgba(125,226,209,0.10)] text-sm">
            <span className="text-snow/50">Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="px-3 h-8 rounded-md bg-onyx text-snow/70 disabled:opacity-40 hover:text-pearl transition-colors">Anterior</button>
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="px-3 h-8 rounded-md bg-onyx text-snow/70 disabled:opacity-40 hover:text-pearl transition-colors">Próxima</button>
            </div>
          </div>
        )}
      </div>

      <ModalFormularioProduto open={modalAberto} onClose={() => setModalAberto(false)} onSave={salvar} editing={editando} />

      <AnimatePresence>
        {confirmarExclusao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setConfirmarExclusao(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-graphite rounded-modal p-6 w-full max-w-sm card-shadow text-center">
              <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-danger" /></div>
              <h3 className="text-snow font-semibold mb-1">Excluir produto?</h3>
              <p className="text-sm text-snow/50 mb-5">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmarExclusao(null)} className="flex-1 h-10 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm">Cancelar</button>
                <button onClick={() => excluir(confirmarExclusao.id)} className="flex-1 h-10 rounded-lg bg-danger text-snow hover:opacity-90 transition-opacity text-sm font-medium">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
