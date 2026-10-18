import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { useCategorias, useExcluirCategoria, useProdutos, useSalvarCategoria } from '@/api/produtos';

const CORES_SUGERIDAS = ['#339989', '#7DE2D1', '#2A7A6E', '#5CBBB0', '#9AE8DB', '#F4A261', '#E76F51', '#8E7DBE', '#4A90D9', '#B5838D'];

function ModalFormularioCategoria({ categoria, onClose, onSave }) {
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [cor, setCor] = useState(categoria?.cor ?? CORES_SUGERIDAS[0]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome da categoria.');
    setSalvando(true);
    try {
      await onSave({ nome: nome.trim(), cor });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  return (
    <Modal titulo={categoria ? 'Editar categoria' : 'Nova categoria'} onClose={onClose} largura="max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="categoria-nome" className="text-xs text-snow/60 mb-1.5 block">Nome</label>
          <input id="categoria-nome" autoFocus value={nome} onChange={(e) => { setNome(e.target.value); setErro(''); }} className="w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm" />
        </div>
        <div>
          <p className="text-xs text-snow/60 mb-1.5">Cor</p>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Cor da categoria">
            {CORES_SUGERIDAS.map((sugerida) => (
              <button
                key={sugerida}
                type="button"
                role="radio"
                aria-checked={cor.toUpperCase() === sugerida.toUpperCase()}
                aria-label={sugerida}
                onClick={() => setCor(sugerida)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${cor.toUpperCase() === sugerida.toUpperCase() ? 'border-snow scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: sugerida }}
              />
            ))}
            <label className="w-8 h-8 rounded-full border border-dashed border-snow/30 overflow-hidden cursor-pointer" title="Outra cor">
              <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-10 h-10 -m-1 cursor-pointer opacity-0" aria-label="Escolher outra cor" />
            </label>
          </div>
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

export default function Categorias() {
  const { toast } = useToast();
  const categoriasQuery = useCategorias();
  const { data: produtos = [] } = useProdutos();
  const salvarCategoria = useSalvarCategoria();
  const excluirCategoria = useExcluirCategoria();
  const [formulario, setFormulario] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  const produtosPorCategoria = useMemo(() => {
    const contagem = new Map();
    for (const p of produtos) contagem.set(p.categoria, (contagem.get(p.categoria) ?? 0) + 1);
    return contagem;
  }, [produtos]);

  const salvar = async (dados) => {
    const editando = formulario.categoria;
    await salvarCategoria.mutateAsync(editando ? { ...dados, id: editando.id } : dados);
    toast({ title: editando ? 'Categoria atualizada' : 'Categoria criada', description: dados.nome });
    setFormulario(null);
  };

  const excluir = () => {
    const categoria = confirmarExclusao;
    excluirCategoria.mutate(categoria.id, {
      onSuccess: () => {
        toast({ title: 'Categoria excluída', description: categoria.nome });
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
      <PageHeader title="Categorias" subtitle="Organização dos produtos no PDV e nos relatórios">
        <button onClick={() => setFormulario({ categoria: null })} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Nova categoria
        </button>
      </PageHeader>

      <EstadoConsulta consulta={categoriasQuery} textoCarregando="Carregando categorias..." className="bg-graphite rounded-card card-shadow">
        {(categoriasQuery.data ?? []).length === 0 ? (
          <div className="bg-graphite rounded-card card-shadow"><EmptyState message="Nenhuma categoria cadastrada" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {categoriasQuery.data.map((categoria) => {
              const quantidade = produtosPorCategoria.get(categoria.id) ?? 0;
              return (
                <div key={categoria.id} className="bg-graphite rounded-card p-5 card-shadow flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg shrink-0" style={{ backgroundColor: categoria.cor }} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-snow font-medium truncate">{categoria.nome}</p>
                    <Link to="/produtos" className="text-xs text-snow/50 hover:text-pearl inline-flex items-center gap-1">
                      <Package size={12} /> {quantidade} {quantidade === 1 ? 'produto' : 'produtos'}
                    </Link>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setFormulario({ categoria })} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label={`Editar ${categoria.nome}`}><Pencil size={15} /></button>
                    <button
                      onClick={() => setConfirmarExclusao(categoria)}
                      disabled={quantidade > 0}
                      title={quantidade > 0 ? 'Mova os produtos para outra categoria antes de excluir' : undefined}
                      className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label={`Excluir ${categoria.nome}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </EstadoConsulta>

      <AnimatePresence mode="wait">
        {formulario && (
          <ModalFormularioCategoria key={formulario.categoria?.id ?? 'nova'} categoria={formulario.categoria} onClose={() => setFormulario(null)} onSave={salvar} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarExclusao && (
          <DialogoConfirmacao titulo="Excluir categoria?" processando={excluirCategoria.isPending} onConfirmar={excluir} onCancelar={() => setConfirmarExclusao(null)}>
            A categoria <strong className="text-snow/80">{confirmarExclusao.nome}</strong> será removida.
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </div>
  );
}
