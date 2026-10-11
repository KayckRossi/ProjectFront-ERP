import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, ArrowDownUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { useEstoque, useMovimentarEstoque } from '@/api/estoque';
import { useCategorias } from '@/api/produtos';
import { contemTexto } from '@/lib/texto';

// Os ids são os mesmos valores aceitos pelo filtro da API (GET /api/estoque?filtro=)
const FILTROS = [
  { id: 'todos', label: 'Todos', aplicar: () => true },
  { id: 'baixo', label: 'Estoque Baixo', aplicar: (p) => p.estoque > 0 && p.status !== 'OK' },
  { id: 'sem-estoque', label: 'Sem Estoque', aplicar: (p) => p.estoque === 0 },
];

const filtroValido = (id) => (FILTROS.some((f) => f.id === id) ? id : 'todos');

function ModalMovimentacao({ produto, onClose, onConfirm }) {
  const [tipo, setTipo] = useState('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const qtd = parseInt(quantidade, 10) || 0;
  const saidaMaiorQueEstoque = tipo === 'saida' && qtd > produto.estoque;

  const submit = async (e) => {
    e.preventDefault();
    if (qtd <= 0 || saidaMaiorQueEstoque) return;
    setSalvando(true);
    try {
      await onConfirm({ produtoId: produto.id, tipo, quantidade: qtd });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  return (
    <Modal titulo="Movimentar estoque" subtitulo={`${produto.nome} · atual: ${produto.estoque} un`} onClose={onClose} largura="max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'entrada', label: 'Entrada' }, { id: 'saida', label: 'Saída / Perda' }].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTipo(t.id); setErro(''); }}
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
            step="1"
            autoFocus
            value={quantidade}
            onChange={(e) => { setQuantidade(e.target.value); setErro(''); }}
            className="w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
          />
          {saidaMaiorQueEstoque && <p role="alert" className="text-xs text-danger mt-1.5">Quantidade maior que o estoque atual.</p>}
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <button
          type="submit"
          disabled={qtd <= 0 || saidaMaiorQueEstoque || salvando}
          className="w-full h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {salvando ? 'Salvando...' : 'Confirmar'}
        </button>
      </form>
    </Modal>
  );
}

export default function Estoque() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const estoqueQuery = useEstoque();
  const { data: categorias = [] } = useCategorias();
  const movimentarEstoque = useMovimentarEstoque();

  const [filtro, setFiltro] = useState(() => filtroValido(searchParams.get('filtro')));
  const [busca, setBusca] = useState('');
  const [movimentando, setMovimentando] = useState(null);

  // As notificações do cabeçalho levam para /estoque?filtro=baixo ou ?filtro=sem-estoque
  useEffect(() => {
    if (searchParams.get('filtro')) setFiltro(filtroValido(searchParams.get('filtro')));
  }, [searchParams]);

  const produtos = estoqueQuery.data ?? [];
  const nomeCategoria = (id) => categorias.find((c) => c.id === id)?.nome || '—';
  const filtroAtual = FILTROS.find((f) => f.id === filtro);

  const filtrados = useMemo(
    () => produtos.filter((p) => filtroAtual.aplicar(p) && (contemTexto(p.nome, busca) || contemTexto(p.sku, busca))),
    [produtos, filtroAtual, busca],
  );

  const confirmarMovimentacao = async (movimentacao) => {
    await movimentarEstoque.mutateAsync(movimentacao);
    const sinal = movimentacao.tipo === 'entrada' ? '+' : '-';
    toast({
      title: movimentacao.tipo === 'entrada' ? 'Entrada registrada' : 'Saída registrada',
      description: `${movimentando.nome}: ${sinal}${movimentacao.quantidade} un.`,
    });
    setMovimentando(null);
  };

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Controle de quantidades e status de reposição" />

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              aria-pressed={filtro === f.id}
              className={`px-4 h-9 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${filtro === f.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
            >
              {f.label} <span className="ml-1.5 text-xs opacity-70">({produtos.filter(f.aplicar).length})</span>
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
        <EstadoConsulta consulta={estoqueQuery} textoCarregando="Carregando estoque...">
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
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                      <td className="py-3 px-4 font-medium text-snow">{p.nome}</td>
                      <td className="py-3 px-4 font-mono text-snow/70">{p.sku || '—'}</td>
                      <td className="py-3 px-4 text-snow/70">{nomeCategoria(p.categoria)}</td>
                      <td className="py-3 px-4 text-center font-semibold text-pearl">{p.estoque}</td>
                      <td className="py-3 px-4 text-center text-snow/60">{p.estoqueMinimo}</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={p.status} /></td>
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
        </EstadoConsulta>
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
