import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, X, Phone, Mail, IdCard } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { clientes as clientesIniciais } from '@/lib/mockData';
import { formatCurrency, initials } from '@/lib/format';

function ModalFormularioCliente({ open, onClose, onSave, editing }) {
  const [form, setForm] = useState(
    editing ? {
      nome: editing.nome || editing.name || '',
      documento: editing.documento || editing.doc || '',
      telefone: editing.telefone || editing.phone || '',
      email: editing.email || '',
    } : {
      nome: '',
      documento: '',
      telefone: '',
      email: '',
    }
  );

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      name: form.nome,
      doc: form.documento,
      phone: form.telefone,
    });
  };

  const campo = (label, name, type = 'text', Icon = null) => (
    <div>
      <label className="text-xs text-snow/60 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />}
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className={`w-full h-10 bg-onyx text-snow rounded-lg ${Icon ? 'pl-10' : 'pl-3'} pr-3 border border-transparent focus:border-verdigris focus:outline-none text-sm`}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-graphite rounded-modal p-6 w-full max-w-md card-shadow">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-snow">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="text-snow/50 hover:text-snow" aria-label="Fechar"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {campo('Nome / Razão Social', 'nome')}
          {campo('CPF / CNPJ', 'documento', 'text', IdCard)}
          {campo('Telefone', 'telefone', 'text', Phone)}
          {campo('E-mail', 'email', 'email', Mail)}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" className="flex-1 h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold">Salvar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Clientes() {
  const [itens, setItens] = useState(clientesIniciais);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  const filtrados = useMemo(() => itens.filter(c => {
    const nome = c.nome || c.name || '';
    const doc = c.documento || c.doc || '';
    return nome.toLowerCase().includes(busca.toLowerCase()) || doc.includes(busca);
  }), [itens, busca]);

  const salvar = (form) => {
    if (editando) {
      setItens(prev => prev.map(c => c.id === editando.id ? { ...c, ...form } : c));
    } else {
      setItens(prev => [...prev, { ...form, id: `c${Date.now()}`, totalCompras: 0, totalPurchases: 0 }]);
    }
    setModalAberto(false);
  };

  const excluir = (id) => {
    setItens(prev => prev.filter(c => c.id !== id));
    setConfirmarExclusao(null);
  };

  return (
    <div>
      <PageHeader title="Clientes" subtitle="Base de clientes e histórico de compras">
        <button onClick={() => { setEditando(null); setModalAberto(true); }} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Novo Cliente
        </button>
      </PageHeader>

      <div className="relative mb-4 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou documento..."
          className="w-full h-10 bg-graphite text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-graphite rounded-card card-shadow"><EmptyState message="Nenhum cliente encontrado" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtrados.map(c => {
              const nome = c.nome || c.name;
              const doc = c.documento || c.doc;
              const tel = c.telefone || c.phone;
              const totalCompras = c.totalCompras ?? c.totalPurchases ?? 0;

              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-graphite rounded-card p-5 card-shadow hover:ring-1 hover:ring-pearl/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-verdigris flex items-center justify-center text-snow font-semibold shrink-0">
                      {initials(nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-snow font-medium truncate">{nome}</p>
                      <p className="text-xs text-snow/50 font-mono">{doc}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditando(c); setModalAberto(true); }} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setConfirmarExclusao(c)} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors" aria-label="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[rgba(125,226,209,0.10)] space-y-1.5 text-sm">
                    <p className="text-snow/70 flex items-center gap-2"><Phone size={14} className="text-pearl/60" /> {tel}</p>
                    <p className="text-snow/70 flex items-center gap-2"><Mail size={14} className="text-pearl/60" /> <span className="truncate">{c.email}</span></p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-snow/50">Total de compras</span>
                    <span className="text-pearl font-semibold">{formatCurrency(totalCompras)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ModalFormularioCliente open={modalAberto} onClose={() => setModalAberto(false)} onSave={salvar} editing={editando} />

      <AnimatePresence>
        {confirmarExclusao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setConfirmarExclusao(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-graphite rounded-modal p-6 w-full max-w-sm card-shadow text-center">
              <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-danger" /></div>
              <h3 className="text-snow font-semibold mb-1">Excluir cliente?</h3>
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
