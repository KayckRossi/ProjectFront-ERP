import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, X, Phone, Mail, IdCard } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { useErpData } from '@/lib/ErpDataContext';
import { formatCurrency, initials } from '@/lib/format';

const somenteDigitos = (v) => v.replace(/\D/g, '');

// Formata CPF (11 dígitos) ou CNPJ (14 dígitos) conforme o usuário digita
function mascaraDocumento(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

const MASCARAS = { documento: mascaraDocumento, telefone: mascaraTelefone };

function ModalFormularioCliente({ open, onClose, onSave, editing }) {
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(
    editing ? {
      nome: editing.nome || '',
      documento: editing.documento || '',
      telefone: editing.telefone || '',
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
    const digitosDoc = somenteDigitos(form.documento).length;
    if (!form.nome.trim()) return setErro('Informe o nome ou razão social.');
    if (digitosDoc && digitosDoc !== 11 && digitosDoc !== 14) return setErro('CPF deve ter 11 dígitos e CNPJ 14.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErro('E-mail inválido.');
    onSave({ ...form, nome: form.nome.trim(), email: form.email.trim() });
  };

  const campo = (label, name, type = 'text', Icon = null) => (
    <div>
      <label className="text-xs text-snow/60 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />}
        <input
          type={type}
          value={form[name]}
          onChange={(e) => {
            setErro('');
            const mascara = MASCARAS[name];
            setForm({ ...form, [name]: mascara ? mascara(e.target.value) : e.target.value });
          }}
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

export default function Clientes() {
  const { clientes: itens, salvarCliente, excluirCliente } = useErpData();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase();
    const termoDigitos = somenteDigitos(busca);
    return itens.filter(c =>
      (c.nome || '').toLowerCase().includes(termo) ||
      (c.email || '').toLowerCase().includes(termo) ||
      (termoDigitos && somenteDigitos(c.documento || '').includes(termoDigitos))
    );
  }, [itens, busca]);

  const salvar = (form) => {
    salvarCliente(editando ? { ...form, id: editando.id } : form);
    setModalAberto(false);
  };

  const excluir = (id) => {
    excluirCliente(id);
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
          placeholder="Buscar por nome, e-mail ou documento..."
          aria-label="Buscar clientes"
          className="w-full h-10 bg-graphite text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-graphite rounded-card card-shadow"><EmptyState message="Nenhum cliente encontrado" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtrados.map(c => {
              const { nome, documento: doc, telefone: tel, totalCompras = 0 } = c;

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
                      <button onClick={() => { setEditando(c); setModalAberto(true); }} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label={`Editar ${nome}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setConfirmarExclusao(c)} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors" aria-label={`Excluir ${nome}`}>
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

      <ModalFormularioCliente key={modalAberto ? (editando?.id ?? 'novo') : 'fechado'} open={modalAberto} onClose={() => setModalAberto(false)} onSave={salvar} editing={editando} />

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
