import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Phone, Mail, IdCard, ShoppingBag } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { useClientes, useExcluirCliente, useSalvarCliente } from '@/api/clientes';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency, initials } from '@/lib/format';
import { EMAIL_VALIDO, mascaraDocumento, mascaraTelefone } from '@/lib/mascaras';
import { contemTexto, somenteDigitos } from '@/lib/texto';

const MASCARAS = { documento: mascaraDocumento, telefone: mascaraTelefone };

function ModalFormularioCliente({ cliente, onClose, onSave }) {
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: cliente?.nome ?? '',
    documento: cliente?.documento ?? '',
    telefone: cliente?.telefone ?? '',
    email: cliente?.email ?? '',
  });

  const submit = async (e) => {
    e.preventDefault();
    const digitosDocumento = somenteDigitos(form.documento).length;
    const digitosTelefone = somenteDigitos(form.telefone).length;
    if (!form.nome.trim()) return setErro('Informe o nome ou razão social.');
    if (digitosDocumento && digitosDocumento !== 11 && digitosDocumento !== 14) return setErro('CPF deve ter 11 dígitos e CNPJ 14.');
    if (digitosTelefone && digitosTelefone < 10) return setErro('Telefone deve ter DDD e 8 ou 9 dígitos.');
    if (form.email && !EMAIL_VALIDO.test(form.email.trim())) return setErro('E-mail inválido.');
    setSalvando(true);
    try {
      await onSave({ ...form, nome: form.nome.trim(), email: form.email.trim() });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  const campo = (rotulo, nome, type = 'text', Icon = null) => (
    <div>
      <label htmlFor={`cliente-${nome}`} className="text-xs text-snow/60 mb-1.5 block">{rotulo}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />}
        <input
          id={`cliente-${nome}`}
          type={type}
          value={form[nome]}
          autoFocus={nome === 'nome'}
          onChange={(e) => {
            setErro('');
            const mascara = MASCARAS[nome];
            setForm({ ...form, [nome]: mascara ? mascara(e.target.value) : e.target.value });
          }}
          className={`w-full h-10 bg-onyx text-snow rounded-lg ${Icon ? 'pl-10' : 'pl-3'} pr-3 border border-transparent focus:border-verdigris focus:outline-none text-sm`}
        />
      </div>
    </div>
  );

  return (
    <Modal titulo={cliente ? 'Editar Cliente' : 'Novo Cliente'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {campo('Nome / Razão Social', 'nome')}
        {campo('CPF / CNPJ', 'documento', 'text', IdCard)}
        {campo('Telefone', 'telefone', 'text', Phone)}
        {campo('E-mail', 'email', 'email', Mail)}
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

export default function Clientes() {
  const { toast } = useToast();
  const { pode } = useAuth();
  const [searchParams] = useSearchParams();
  const clientesQuery = useClientes();
  const salvarCliente = useSalvarCliente();
  const excluirCliente = useExcluirCliente();

  const [busca, setBusca] = useState(() => searchParams.get('busca') ?? '');
  const [formulario, setFormulario] = useState(null); // { cliente } aberto; cliente null = novo
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  useEffect(() => {
    const buscaDaUrl = searchParams.get('busca');
    if (buscaDaUrl !== null) setBusca(buscaDaUrl);
  }, [searchParams]);

  const filtrados = useMemo(() => {
    const digitos = somenteDigitos(busca);
    return (clientesQuery.data ?? []).filter((c) =>
      contemTexto(c.nome, busca) ||
      contemTexto(c.email, busca) ||
      (digitos && somenteDigitos(c.documento).includes(digitos))
    );
  }, [clientesQuery.data, busca]);

  const salvar = async (dados) => {
    const editando = formulario.cliente;
    await salvarCliente.mutateAsync(editando ? { ...dados, id: editando.id } : dados);
    toast({ title: editando ? 'Cliente atualizado' : 'Cliente cadastrado', description: dados.nome });
    setFormulario(null);
  };

  const excluir = () => {
    const cliente = confirmarExclusao;
    excluirCliente.mutate(cliente.id, {
      onSuccess: () => {
        toast({ title: 'Cliente excluído', description: cliente.nome });
        setConfirmarExclusao(null);
      },
      onError: (erro) => toast({ title: 'Não foi possível excluir', description: erro.message, variant: 'destructive' }),
    });
  };

  return (
    <div>
      <PageHeader title="Clientes" subtitle="Base de clientes e histórico de compras">
        <button onClick={() => setFormulario({ cliente: null })} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
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

      <EstadoConsulta consulta={clientesQuery} textoCarregando="Carregando clientes..." className="bg-graphite rounded-card card-shadow">
        {filtrados.length === 0 ? (
          <div className="bg-graphite rounded-card card-shadow"><EmptyState message="Nenhum cliente encontrado" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtrados.map((c) => (
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
                      {initials(c.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-snow font-medium truncate">{c.nome}</p>
                      <p className="text-xs text-snow/50 font-mono">{c.documento || 'Sem documento'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setFormulario({ cliente: c })} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label={`Editar ${c.nome}`}>
                        <Pencil size={15} />
                      </button>
                      {pode('clientes.excluir') && (
                        <button onClick={() => setConfirmarExclusao(c)} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors" aria-label={`Excluir ${c.nome}`}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[rgba(125,226,209,0.10)] space-y-1.5 text-sm">
                    <p className="text-snow/70 flex items-center gap-2"><Phone size={14} className="text-pearl/60" /> {c.telefone || '—'}</p>
                    <p className="text-snow/70 flex items-center gap-2"><Mail size={14} className="text-pearl/60" /> <span className="truncate">{c.email || '—'}</span></p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-snow/50 block">Total de compras</span>
                      <span className="text-pearl font-semibold">{formatCurrency(c.totalCompras)}</span>
                    </div>
                    <Link
                      to={`/vendas?clienteId=${encodeURIComponent(c.id)}`}
                      className="h-8 px-3 rounded-md text-xs font-medium text-pearl border border-pearl/30 hover:bg-pearl-muted transition-colors inline-flex items-center gap-1.5"
                      aria-label={`Ver compras de ${c.nome}`}
                    >
                      <ShoppingBag size={14} /> Ver compras
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </EstadoConsulta>

      {/* mode="wait": ao trocar de registro, o formulário anterior sai antes do próximo abrir */}
      <AnimatePresence mode="wait">
        {formulario && (
          <ModalFormularioCliente
            key={formulario.cliente?.id ?? 'novo'}
            cliente={formulario.cliente}
            onClose={() => setFormulario(null)}
            onSave={salvar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarExclusao && (
          <DialogoConfirmacao
            titulo="Excluir cliente?"
            processando={excluirCliente.isPending}
            onConfirmar={excluir}
            onCancelar={() => setConfirmarExclusao(null)}
          >
            <strong className="text-snow/80">{confirmarExclusao.nome}</strong> será removido. As vendas já feitas continuam no histórico.
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </div>
  );
}
