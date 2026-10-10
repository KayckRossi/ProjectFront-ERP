import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Plus, Minus, Trash2, Barcode, X, Banknote, CreditCard, QrCode, KanbanSquare, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';
import KanbanPedidos from '@/components/KanbanPedidos';
import { useErpData } from '@/lib/ErpDataContext';
import { formatCurrency } from '@/lib/format';

const PAGAMENTOS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'cartao', label: 'Cartão', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: QrCode },
];

const DESCONTOS_RAPIDOS = [5, 10, 15];

// Aceita "10,50" e "10.50"
const lerValor = (texto) => parseFloat(String(texto).replace(',', '.')) || 0;

function MiniaturaProduto({ nome }) {
  return (
    <div className="aspect-square rounded-lg gradient-pearl flex items-center justify-center mb-3">
      <span className="text-3xl font-bold text-pearl/70">{nome?.[0]?.toUpperCase()}</span>
    </div>
  );
}

export default function PDV() {
  const { toast } = useToast();
  const { produtos, categorias, clientes, registrarVenda } = useErpData();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('all');
  const [carrinho, setCarrinho] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState(0);
  const [painelDescontoAberto, setPainelDescontoAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [abaAtual, setAbaAtual] = useState('caixa');

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter(p =>
      (categoriaAtiva === 'all' || p.categoria === categoriaAtiva) &&
      (p.nome.toLowerCase().includes(termo) || (p.sku || '').toLowerCase().includes(termo))
    );
  }, [produtos, busca, categoriaAtiva]);

  const estoqueDisponivel = (id) => produtos.find(p => p.id === id)?.estoque ?? 0;

  const avisarEstoque = (nome, estoque) => toast({
    title: 'Estoque insuficiente',
    description: estoque > 0 ? `Só há ${estoque} un. de ${nome} em estoque.` : `${nome} está sem estoque.`,
    variant: 'destructive',
  });

  const adicionarAoCarrinho = (p) => {
    const noCarrinho = carrinho.find(i => i.id === p.id)?.quantidade ?? 0;
    if (noCarrinho + 1 > p.estoque) {
      avisarEstoque(p.nome, p.estoque);
      return;
    }
    setCarrinho(prev => noCarrinho
      ? prev.map(i => i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      : [...prev, { id: p.id, nome: p.nome, preco: p.preco, quantidade: 1 }]);
  };

  const alterarQuantidade = (id, delta) => {
    const item = carrinho.find(i => i.id === id);
    if (!item) return;
    const estoque = estoqueDisponivel(id);
    if (delta > 0 && item.quantidade + delta > estoque) {
      avisarEstoque(item.nome, estoque);
      return;
    }
    setCarrinho(prev => prev
      .map(i => i.id === id ? { ...i, quantidade: i.quantidade + delta } : i)
      .filter(i => i.quantidade > 0));
  };

  const removerItem = (id) => setCarrinho(prev => prev.filter(i => i.id !== id));

  const limparVenda = () => {
    setCarrinho([]);
    setDescontoPercentual(0);
    setPainelDescontoAberto(false);
    setClienteId('');
  };

  const subtotal = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const desconto = Math.round(subtotal * descontoPercentual) / 100;
  const total = Math.max(0, subtotal - desconto);
  const qtdItens = carrinho.reduce((s, i) => s + i.quantidade, 0);

  const recebido = lerValor(valorRecebido);
  const troco = Math.max(0, recebido - total);
  const pagamentoInsuficiente = formaPagamento === 'dinheiro' && recebido < total;

  const abrirPagamento = () => {
    setValorRecebido('');
    setModalPagamentoAberto(true);
  };

  const finalizarVenda = () => {
    if (pagamentoInsuficiente) return;
    const numero = registrarVenda({ itens: carrinho, total, formaPagamento, clienteId });
    toast({
      title: `Venda #${numero} finalizada ✓`,
      description: formaPagamento === 'dinheiro' && troco > 0
        ? `Total de ${formatCurrency(total)}. Troco: ${formatCurrency(troco)}.`
        : `Total de ${formatCurrency(total)} processado com sucesso.`,
      className: 'bg-graphite border-l-4 border-verdigris text-snow',
    });
    limparVenda();
    setModalPagamentoAberto(false);
    setValorRecebido('');
  };

  const lerCodigoBarras = (e) => {
    if (e.key !== 'Enter') return;
    const input = e.target;
    const codigo = input.value.trim();
    if (!codigo) return;
    const p = produtos.find(pr => pr.codigoBarras === codigo || pr.sku === codigo.toUpperCase());
    if (p) {
      adicionarAoCarrinho(p);
    } else {
      toast({ title: 'Produto não encontrado', description: `Nenhum produto com o código ${codigo}.`, variant: 'destructive' });
    }
    input.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Ponto de Venda" subtitle="Selecione produtos e finalize a venda">
        <div className="flex items-center gap-1 bg-graphite rounded-lg p-1 border border-[rgba(125,226,209,0.10)]">
          <button
            onClick={() => setAbaAtual('caixa')}
            className={`flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-colors ${abaAtual === 'caixa' ? 'bg-verdigris text-snow' : 'text-snow/60 hover:text-snow'}`}
          >
            <ShoppingCart size={16} /> Caixa
          </button>
          <button
            onClick={() => setAbaAtual('pedidos')}
            className={`flex items-center gap-2 px-3 h-9 rounded-md text-sm font-medium transition-colors ${abaAtual === 'pedidos' ? 'bg-verdigris text-snow' : 'text-snow/60 hover:text-snow'}`}
          >
            <KanbanSquare size={16} /> Pedidos
          </button>
        </div>
      </PageHeader>

      {abaAtual === 'pedidos' ? (
        <KanbanPedidos />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] lg:grid-rows-[minmax(0,1fr)] gap-4 flex-1 min-h-0">
        {/* Produtos */}
        <div className="flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto ou SKU..."
                aria-label="Buscar produto"
                className="w-full h-10 bg-graphite text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
              />
            </div>
            <div className="relative">
              <Barcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
              <input
                placeholder="Código de barras"
                aria-label="Código de barras (Enter para adicionar)"
                onKeyDown={lerCodigoBarras}
                className="w-full sm:w-56 h-10 bg-graphite text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm font-mono"
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoriaAtiva('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${categoriaAtiva === 'all' ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
            >
              Todos
            </button>
            {categorias.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoriaAtiva(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${categoriaAtiva === c.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
              >
                {c.nome}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
            {produtosFiltrados.map(p => {
              const esgotado = p.estoque <= 0;
              return (
                <motion.button
                  key={p.id}
                  whileTap={esgotado ? undefined : { scale: 0.95 }}
                  onClick={() => adicionarAoCarrinho(p)}
                  disabled={esgotado}
                  aria-label={`Adicionar ${p.nome} ao carrinho`}
                  className="text-left bg-graphite rounded-card p-3 card-shadow hover:ring-1 hover:ring-pearl/40 transition-all group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:ring-0"
                >
                  <MiniaturaProduto nome={p.nome} />
                  <p className="text-sm text-snow font-medium leading-tight line-clamp-2 min-h-[2.5rem]">{p.nome}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-verdigris font-semibold">{formatCurrency(p.preco)}</span>
                    <span className={`text-xs ${esgotado ? 'text-danger' : 'text-snow/40'}`}>{esgotado ? 'Esgotado' : `${p.estoque} un`}</span>
                  </div>
                </motion.button>
              );
            })}
            {produtosFiltrados.length === 0 && (
              <p className="col-span-full text-center py-12 text-snow/40 text-sm">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="bg-graphite rounded-card card-shadow flex flex-col min-h-0 max-h-full"
        >
          <div className="p-5 border-b border-[rgba(125,226,209,0.10)] flex items-center justify-between">
            <h2 className="font-semibold text-snow flex items-center gap-2">
              <ShoppingCart size={18} className="text-pearl" /> Carrinho
            </h2>
            <span className="text-sm text-snow/50">{qtdItens} itens</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence initial={false}>
              {carrinho.map(item => {
                const { nome, preco, quantidade: qtd } = item;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex items-center gap-3 bg-onyx rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-snow font-medium truncate">{nome}</p>
                      <p className="text-xs text-snow/50">{formatCurrency(preco)} cada</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => alterarQuantidade(item.id, -1)} className="w-7 h-7 rounded-md bg-graphite-hover text-pearl flex items-center justify-center hover:bg-verdigris hover:text-snow transition-colors" aria-label={`Diminuir quantidade de ${nome}`}>
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm text-snow">{qtd}</span>
                      <button onClick={() => alterarQuantidade(item.id, 1)} className="w-7 h-7 rounded-md bg-graphite-hover text-pearl flex items-center justify-center hover:bg-verdigris hover:text-snow transition-colors" aria-label={`Aumentar quantidade de ${nome}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm text-snow font-medium w-20 text-right">{formatCurrency(preco * qtd)}</span>
                    <button onClick={() => removerItem(item.id)} className="text-snow/30 hover:text-danger transition-colors" aria-label={`Remover ${nome}`}>
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {carrinho.length === 0 && (
              <div className="text-center py-12 text-snow/40 text-sm">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-40" />
                Carrinho vazio. Toque em um produto para adicionar.
              </div>
            )}
          </div>

          <div className="p-5 border-t border-[rgba(125,226,209,0.10)] space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                aria-label="Cliente da venda"
                className="w-full h-10 bg-onyx text-snow rounded-lg pl-9 pr-3 border border-transparent focus:border-verdigris focus:outline-none text-sm"
              >
                <option value="">Consumidor final</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            {painelDescontoAberto && (
              <div className="flex items-center gap-2">
                {DESCONTOS_RAPIDOS.map(pct => (
                  <button
                    key={pct}
                    onClick={() => setDescontoPercentual(pct)}
                    className={`h-8 px-2.5 rounded-md text-xs font-medium border transition-colors ${descontoPercentual === pct ? 'bg-verdigris text-snow border-verdigris' : 'border-pearl/30 text-pearl hover:bg-pearl-muted'}`}
                  >
                    {pct}%
                  </button>
                ))}
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={descontoPercentual || ''}
                    onChange={(e) => setDescontoPercentual(Math.min(100, Math.max(0, lerValor(e.target.value))))}
                    placeholder="Outro"
                    aria-label="Desconto em porcentagem"
                    className="w-full h-8 bg-onyx text-snow rounded-md pl-2 pr-6 border border-transparent focus:border-verdigris focus:outline-none text-xs"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-snow/40">%</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-snow/60">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex items-center justify-between text-sm text-warning">
                <span>Desconto ({descontoPercentual}%)</span>
                <span>-{formatCurrency(desconto)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-lg font-semibold text-snow">
              <span>Total</span>
              <span className="text-pearl">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPainelDescontoAberto(aberto => !aberto)}
                aria-expanded={painelDescontoAberto}
                className="h-10 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!carrinho.length}
              >
                Desconto
              </button>
              <button className="h-10 rounded-lg border border-danger/40 text-danger text-sm font-medium hover:bg-danger/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" disabled={!carrinho.length} onClick={limparVenda}>
                Cancelar
              </button>
            </div>
            <button
              onClick={abrirPagamento}
              disabled={!carrinho.length}
              className="w-full h-12 rounded-lg bg-verdigris text-snow font-semibold hover:bg-verdigris-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finalizar Venda
            </button>
          </div>
        </motion.div>
      </div>
      )}

      {/* Modal Pagamento */}
      <AnimatePresence>
        {modalPagamentoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setModalPagamentoAberto(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-graphite rounded-modal p-6 w-full max-w-md card-shadow"
            >
              <button onClick={() => setModalPagamentoAberto(false)} className="absolute top-4 right-4 text-snow/50 hover:text-snow" aria-label="Fechar">
                <X size={20} />
              </button>
              <h2 className="text-lg font-semibold text-snow mb-1">Pagamento</h2>
              <p className="text-sm text-snow/50 mb-5">Total a pagar: <span className="text-pearl font-semibold">{formatCurrency(total)}</span></p>

              <p className="text-sm text-snow/70 mb-2">Forma de pagamento</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {PAGAMENTOS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setFormaPagamento(p.id)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-lg border transition-all ${formaPagamento === p.id ? 'border-verdigris bg-verdigris-light text-pearl' : 'border-transparent bg-onyx text-snow/60 hover:text-snow'}`}
                    >
                      <Icon size={22} />
                      <span className="text-xs font-medium">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {formaPagamento === 'dinheiro' && (
                <div className="mb-5">
                  <label className="text-sm text-snow/70 block mb-2">Valor recebido</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') finalizarVenda(); }}
                    placeholder="0,00"
                    aria-label="Valor recebido"
                    className="w-full h-11 bg-onyx text-snow rounded-lg px-4 border border-transparent focus:border-verdigris focus:outline-none"
                  />
                  {valorRecebido && (pagamentoInsuficiente ? (
                    <p className="text-sm text-danger mt-2">Faltam {formatCurrency(total - recebido)}</p>
                  ) : (
                    <p className="text-sm text-snow/60 mt-2">Troco: <span className="text-pearl font-medium">{formatCurrency(troco)}</span></p>
                  ))}
                </div>
              )}

              <button
                onClick={finalizarVenda}
                disabled={pagamentoInsuficiente}
                className="w-full h-12 rounded-lg bg-verdigris text-snow font-semibold hover:bg-verdigris-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmar Pagamento
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
