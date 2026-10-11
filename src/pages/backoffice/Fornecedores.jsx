import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Phone, Mail, ShoppingBasket } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { useExcluirFornecedor, useFornecedores, useSalvarFornecedor } from '@/api/fornecedores';
import { EMAIL_VALIDO, mascaraCnpj, mascaraTelefone } from '@/lib/mascaras';
import { contemTexto, somenteDigitos } from '@/lib/texto';

const classeCampo = 'w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';
const MASCARAS = { cnpj: mascaraCnpj, telefone: mascaraTelefone };

function ModalFormularioFornecedor({ fornecedor, onClose, onSave }) {
  const [form, setForm] = useState({
    razaoSocial: fornecedor?.razaoSocial ?? '',
    nomeFantasia: fornecedor?.nomeFantasia ?? '',
    cnpj: fornecedor?.cnpj ?? '',
    contato: fornecedor?.contato ?? '',
    telefone: fornecedor?.telefone ?? '',
    email: fornecedor?.email ?? '',
    prazoPagamentoDias: String(fornecedor?.prazoPagamentoDias ?? 30),
    observacoes: fornecedor?.observacoes ?? '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo, valor) => {
    setErro('');
    setForm((atual) => ({ ...atual, [campo]: MASCARAS[campo] ? MASCARAS[campo](valor) : valor }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const digitosCnpj = somenteDigitos(form.cnpj).length;
    if (!form.razaoSocial.trim()) return setErro('Informe a razão social.');
    if (digitosCnpj && digitosCnpj !== 14) return setErro('O CNPJ deve ter 14 dígitos.');
    if (form.email && !EMAIL_VALIDO.test(form.email.trim())) return setErro('E-mail inválido.');
    setSalvando(true);
    try {
      await onSave({ ...form, razaoSocial: form.razaoSocial.trim(), email: form.email.trim(), prazoPagamentoDias: parseInt(form.prazoPagamentoDias, 10) || 0 });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  const campo = (rotulo, nome, props = {}) => (
    <div className={props.inteiro ? 'col-span-2' : ''}>
      <label htmlFor={`fornecedor-${nome}`} className="text-xs text-snow/60 mb-1.5 block">{rotulo}</label>
      <input id={`fornecedor-${nome}`} value={form[nome]} onChange={(e) => alterar(nome, e.target.value)} className={classeCampo} {...props.input} />
    </div>
  );

  return (
    <Modal titulo={fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'} onClose={onClose} largura="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {campo('Razão social', 'razaoSocial', { inteiro: true, input: { autoFocus: true } })}
          {campo('Nome fantasia', 'nomeFantasia')}
          {campo('CNPJ', 'cnpj', { input: { inputMode: 'numeric', className: `${classeCampo} font-mono` } })}
          {campo('Contato', 'contato')}
          {campo('Telefone', 'telefone', { input: { inputMode: 'tel' } })}
          {campo('E-mail', 'email', { input: { type: 'email' } })}
          {campo('Prazo de pagamento (dias)', 'prazoPagamentoDias', { input: { type: 'number', min: 0, max: 365, step: 1 } })}
          {campo('Observações', 'observacoes', { inteiro: true })}
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

export default function Fornecedores() {
  const { toast } = useToast();
  const fornecedoresQuery = useFornecedores();
  const salvarFornecedor = useSalvarFornecedor();
  const excluirFornecedor = useExcluirFornecedor();
  const [busca, setBusca] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  const filtrados = useMemo(() => {
    const digitos = somenteDigitos(busca);
    return (fornecedoresQuery.data ?? []).filter((f) =>
      contemTexto(f.razaoSocial, busca) || contemTexto(f.nomeFantasia, busca) || contemTexto(f.contato, busca) ||
      (digitos && somenteDigitos(f.cnpj).includes(digitos))
    );
  }, [fornecedoresQuery.data, busca]);

  const salvar = async (dados) => {
    const editando = formulario.fornecedor;
    await salvarFornecedor.mutateAsync(editando ? { ...dados, id: editando.id } : dados);
    toast({ title: editando ? 'Fornecedor atualizado' : 'Fornecedor cadastrado', description: dados.nomeFantasia || dados.razaoSocial });
    setFormulario(null);
  };

  const excluir = () => {
    const fornecedor = confirmarExclusao;
    excluirFornecedor.mutate(fornecedor.id, {
      onSuccess: () => {
        toast({ title: 'Fornecedor excluído', description: fornecedor.nomeFantasia || fornecedor.razaoSocial });
        setConfirmarExclusao(null);
      },
      onError: (erro) => {
        toast({ title: 'Não foi possível excluir', description: erro.message, variant: 'destructive' });
        setConfirmarExclusao(null);
      },
    });
  };

  return (
    <div>
      <PageHeader title="Fornecedores" subtitle="Cadastro de fornecedores e condições de pagamento">
        <button onClick={() => setFormulario({ fornecedor: null })} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Novo fornecedor
        </button>
      </PageHeader>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 border-b border-[rgba(125,226,209,0.10)]">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, contato ou CNPJ..." aria-label="Buscar fornecedores" className={`${classeCampo} pl-10`} />
          </div>
        </div>
        <EstadoConsulta consulta={fornecedoresQuery} textoCarregando="Carregando fornecedores...">
          {filtrados.length === 0 ? <EmptyState message="Nenhum fornecedor encontrado" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Fornecedor</th>
                    <th scope="col" className="font-medium py-3 px-4">CNPJ</th>
                    <th scope="col" className="font-medium py-3 px-4">Contato</th>
                    <th scope="col" className="font-medium py-3 px-4 text-center">Prazo</th>
                    <th scope="col" className="font-medium py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((f) => {
                    const nome = f.nomeFantasia || f.razaoSocial;
                    return (
                      <tr key={f.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-snow font-medium">{nome}</p>
                          {f.nomeFantasia && <p className="text-xs text-snow/50">{f.razaoSocial}</p>}
                        </td>
                        <td className="py-3 px-4 font-mono text-snow/70 whitespace-nowrap">{f.cnpj || '—'}</td>
                        <td className="py-3 px-4 text-snow/70">
                          <p>{f.contato || '—'}</p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-snow/50">
                            {f.telefone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {f.telefone}</span>}
                            {f.email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {f.email}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-snow/70 whitespace-nowrap">{f.prazoPagamentoDias} dias</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/backoffice/compras?novaCompra=${encodeURIComponent(f.id)}`} className="h-8 px-2.5 rounded-md text-xs font-medium text-pearl hover:bg-verdigris-light transition-colors inline-flex items-center gap-1.5" aria-label={`Nova compra de ${nome}`}>
                              <ShoppingBasket size={14} /> Nova compra
                            </Link>
                            <button onClick={() => setFormulario({ fornecedor: f })} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label={`Editar ${nome}`}><Pencil size={15} /></button>
                            <button onClick={() => setConfirmarExclusao(f)} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors" aria-label={`Excluir ${nome}`}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </EstadoConsulta>
      </div>

      <AnimatePresence mode="wait">
        {formulario && (
          <ModalFormularioFornecedor key={formulario.fornecedor?.id ?? 'novo'} fornecedor={formulario.fornecedor} onClose={() => setFormulario(null)} onSave={salvar} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarExclusao && (
          <DialogoConfirmacao titulo="Excluir fornecedor?" processando={excluirFornecedor.isPending} onConfirmar={excluir} onCancelar={() => setConfirmarExclusao(null)}>
            <strong className="text-snow/80">{confirmarExclusao.nomeFantasia || confirmarExclusao.razaoSocial}</strong> será removido. Fornecedores com compras registradas não podem ser excluídos.
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </div>
  );
}
