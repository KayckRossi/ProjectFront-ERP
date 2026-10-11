import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import Paginacao from '@/components/Paginacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { usePaginacao } from '@/hooks/usePaginacao';
import { useCategorias, useExcluirProduto, useProdutos, useSalvarProduto } from '@/api/produtos';
import { formatCurrency } from '@/lib/format';
import { lerValorMonetario } from '@/lib/dinheiro';
import { contemTexto } from '@/lib/texto';

const POR_PAGINA = 8;

const classeCampo = 'w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

function ModalFormularioProduto({ produto, categorias, onClose, onSave }) {
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  // Campos numéricos ficam como texto enquanto o usuário digita e são convertidos ao salvar
  const [form, setForm] = useState({
    nome: produto?.nome ?? '',
    sku: produto?.sku ?? '',
    codigoBarras: produto?.codigoBarras ?? '',
    categoria: produto?.categoria ?? categorias[0]?.id ?? '',
    custo: produto ? String(produto.custo).replace('.', ',') : '',
    preco: produto ? String(produto.preco).replace('.', ',') : '',
    estoque: String(produto?.estoque ?? 0),
    estoqueMinimo: String(produto?.estoqueMinimo ?? 0),
  });

  const custo = lerValorMonetario(form.custo);
  const preco = lerValorMonetario(form.preco);
  const margem = preco > 0 ? (((preco - custo) / preco) * 100).toFixed(1) : '0.0';

  const alterar = (campo, valor) => {
    setErro('');
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setErro('Informe o nome do produto.');
    if (preco <= 0) return setErro('O preço de venda deve ser maior que zero.');
    if (preco < custo) return setErro('O preço de venda está abaixo do custo.');
    setSalvando(true);
    try {
      await onSave({
        nome: form.nome.trim(),
        sku: form.sku.trim().toUpperCase(),
        categoria: form.categoria,
        custo,
        preco,
        estoque: parseInt(form.estoque, 10) || 0,
        estoqueMinimo: parseInt(form.estoqueMinimo, 10) || 0,
        // Sem código de barras o backend gera um automaticamente
        ...(form.codigoBarras.trim() && { codigoBarras: form.codigoBarras.trim() }),
      });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  const campo = (rotulo, nome, props = {}) => (
    <div>
      <label htmlFor={`produto-${nome}`} className="text-xs text-snow/60 mb-1.5 block">{rotulo}</label>
      <input id={`produto-${nome}`} value={form[nome]} onChange={(e) => alterar(nome, e.target.value)} className={classeCampo} {...props} />
    </div>
  );

  return (
    <Modal titulo={produto ? 'Editar Produto' : 'Novo Produto'} onClose={onClose} largura="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {campo('Nome', 'nome', { autoFocus: true })}
          {campo('SKU', 'sku')}
          <div>
            <label htmlFor="produto-categoria" className="text-xs text-snow/60 mb-1.5 block">Categoria</label>
            <select id="produto-categoria" value={form.categoria} onChange={(e) => alterar('categoria', e.target.value)} className={classeCampo}>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          {campo('Código de barras', 'codigoBarras', { inputMode: 'numeric', placeholder: 'Gerado se vazio', className: `${classeCampo} font-mono` })}
          {campo('Estoque atual', 'estoque', { type: 'number', min: 0, step: 1 })}
          {campo('Estoque mínimo', 'estoqueMinimo', { type: 'number', min: 0, step: 1 })}
          {campo('Preço de custo (R$)', 'custo', { inputMode: 'decimal', placeholder: '0,00' })}
          {campo('Preço de venda (R$)', 'preco', { inputMode: 'decimal', placeholder: '0,00' })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-snow/60">Margem calculada:</span>
          <span className="text-pearl font-medium">{margem}%</span>
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

export default function Produtos() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const produtosQuery = useProdutos();
  const { data: categorias = [] } = useCategorias();
  const salvarProduto = useSalvarProduto();
  const excluirProduto = useExcluirProduto();

  const [busca, setBusca] = useState(() => searchParams.get('busca') ?? '');
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [formulario, setFormulario] = useState(null); // { produto } aberto; produto null = novo
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  // A busca global do cabeçalho navega para /produtos?busca=...
  useEffect(() => {
    const buscaDaUrl = searchParams.get('busca');
    if (buscaDaUrl !== null) setBusca(buscaDaUrl);
  }, [searchParams]);

  const filtrados = useMemo(() => (produtosQuery.data ?? []).filter((p) =>
    (filtroCategoria === 'all' || p.categoria === filtroCategoria) &&
    (contemTexto(p.nome, busca) || contemTexto(p.sku, busca) || p.codigoBarras === busca.trim())
  ), [produtosQuery.data, busca, filtroCategoria]);

  const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(filtrados, POR_PAGINA, `${busca}|${filtroCategoria}`);
  const nomeCategoria = (id) => categorias.find((c) => c.id === id)?.nome ?? '—';

  const salvar = async (dados) => {
    const editando = formulario.produto;
    await salvarProduto.mutateAsync(editando ? { ...dados, id: editando.id } : dados);
    toast({ title: editando ? 'Produto atualizado' : 'Produto cadastrado', description: dados.nome });
    setFormulario(null);
  };

  const excluir = () => {
    const produto = confirmarExclusao;
    excluirProduto.mutate(produto.id, {
      onSuccess: () => {
        toast({ title: 'Produto excluído', description: produto.nome });
        setConfirmarExclusao(null);
      },
      onError: (erro) => toast({ title: 'Não foi possível excluir', description: erro.message, variant: 'destructive' }),
    });
  };

  return (
    <div>
      <PageHeader title="Produtos" subtitle="Cadastre e gerencie seu catálogo">
        <button onClick={() => setFormulario({ produto: null })} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Novo Produto
        </button>
      </PageHeader>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-[rgba(125,226,209,0.10)]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, SKU ou código de barras..."
              aria-label="Buscar produtos"
              className="w-full h-10 bg-onyx text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            aria-label="Filtrar por categoria"
            className="h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
          >
            <option value="all">Todas categorias</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <EstadoConsulta consulta={produtosQuery} textoCarregando="Carregando produtos...">
          {itensPagina.length === 0 ? <EmptyState message="Nenhum produto corresponde à busca" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Produto</th>
                    <th scope="col" className="font-medium py-3 px-4">SKU</th>
                    <th scope="col" className="font-medium py-3 px-4">Categoria</th>
                    <th scope="col" className="font-medium py-3 px-4">Custo</th>
                    <th scope="col" className="font-medium py-3 px-4">Venda</th>
                    <th scope="col" className="font-medium py-3 px-4">Margem</th>
                    <th scope="col" className="font-medium py-3 px-4">Estoque</th>
                    <th scope="col" className="font-medium py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((p) => {
                    const margem = p.preco ? (((p.preco - p.custo) / p.preco) * 100).toFixed(0) : '0';
                    const corEstoque = p.estoque === 0 ? 'text-danger' : p.estoque < p.estoqueMinimo ? 'text-warning' : 'text-snow/70';
                    return (
                      <tr key={p.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg gradient-pearl flex items-center justify-center text-pearl font-semibold shrink-0">{p.nome[0]}</div>
                            <span className="text-snow font-medium">{p.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-snow/70">{p.sku || '—'}</p>
                          {p.codigoBarras && <p className="font-mono text-[11px] text-snow/40">{p.codigoBarras}</p>}
                        </td>
                        <td className="py-3 px-4 text-snow/70">{nomeCategoria(p.categoria)}</td>
                        <td className="py-3 px-4 text-snow/70">{formatCurrency(p.custo)}</td>
                        <td className="py-3 px-4 text-snow font-medium">{formatCurrency(p.preco)}</td>
                        <td className="py-3 px-4 text-pearl">{margem}%</td>
                        <td className={`py-3 px-4 font-medium ${corEstoque}`}>{p.estoque}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setFormulario({ produto: p })} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label={`Editar ${p.nome}`}><Pencil size={15} /></button>
                            <button onClick={() => setConfirmarExclusao(p)} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/60 hover:text-danger flex items-center justify-center transition-colors" aria-label={`Excluir ${p.nome}`}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} totalItens={filtrados.length} rotulo="produtos" />
        </EstadoConsulta>
      </div>

      {/* mode="wait": ao trocar de registro, o formulário anterior sai antes do próximo abrir */}
      <AnimatePresence mode="wait">
        {formulario && (
          <ModalFormularioProduto
            key={formulario.produto?.id ?? 'novo'}
            produto={formulario.produto}
            categorias={categorias}
            onClose={() => setFormulario(null)}
            onSave={salvar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmarExclusao && (
          <DialogoConfirmacao
            titulo="Excluir produto?"
            processando={excluirProduto.isPending}
            onConfirmar={excluir}
            onCancelar={() => setConfirmarExclusao(null)}
          >
            <strong className="text-snow/80">{confirmarExclusao.nome}</strong> será removido do catálogo. As vendas já feitas continuam no histórico.
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </div>
  );
}
