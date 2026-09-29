import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Plus, Minus, Trash2, Barcode, X, Banknote, CreditCard, QrCode, KanbanSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';
import KanbanPedidos from '@/components/KanbanPedidos';
import { produtos, categorias } from '@/lib/mockData';
import { formatCurrency } from '@/lib/format';

const PAGAMENTOS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'cartao', label: 'Cartão', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: QrCode },
];

function MiniaturaProduto({ nome }) {
  return (
    <div className="aspect-square rounded-lg gradient-pearl flex items-center justify-center mb-3">
      <span className="text-3xl font-bold text-pearl/70">{nome?.[0]?.toUpperCase()}</span>
    </div>
  );
}

export default function PDV() {
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('all');
  const [carrinho, setCarrinho] = useState([]);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [abaAtual, setAbaAtual] = useState('caixa');

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const cat = p.categoria || p.category;
      const nome = p.nome || p.name;
      return (categoriaAtiva === 'all' || cat === categoriaAtiva) &&
        nome.toLowerCase().includes(busca.toLowerCase());
    });
  }, [busca, categoriaAtiva]);

  const adicionarAoCarrinho = (p) => {
    const nome = p.nome || p.name;
    const preco = p.preco ?? p.price;
    setCarrinho(prev => {
      const itemExistente = prev.find(i => i.id === p.id);
      if (itemExistente) {
        return prev.map(i => i.id === p.id ? { ...i, quantidade: i.quantidade + 1, qty: i.quantidade + 1 } : i);
      }
      return [...prev, { ...p, id: p.id, nome, name: nome, preco, price: preco, quantidade: 1, qty: 1 }];
    });
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho(prev => prev
      .map(i => {
        if (i.id === id) {
          const novaQtd = (i.quantidade || i.qty) + delta;
          return { ...i, quantidade: novaQtd, qty: novaQtd };
        }
        return i;
      })
      .filter(i => (i.quantidade || i.qty) > 0));
  };

  const removerItem = (id) => setCarrinho(prev => prev.filter(i => i.id !== id));

  const subtotal = carrinho.reduce((s, i) => s + (i.preco ?? i.price) * (i.quantidade ?? i.qty), 0);
  const total = subtotal;

  const finalizarVenda = () => {
    toast({
      title: 'Venda finalizada ✓',
      description: `Total de ${formatCurrency(total)} processado com sucesso.`,
      className: 'bg-graphite border-l-4 border-verdigris text-snow',
    });
    setCarrinho([]);
    setModalPagamentoAberto(false);
    setValorRecebido('');
  };

  const troco = valorRecebido ? Math.max(0, parseFloat(valorRecebido) - total) : 0;

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 flex-1 min-h-0">
        {/* Produtos */}
        <div className="flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full h-10 bg-graphite text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
              />
            </div>
            <div className="relative">
              <Barcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
              <input
                placeholder="Código de barras"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target;
                    const p = produtos.find(pr => (pr.codigoBarras || pr.barcode) === input.value);
                    if (p) { adicionarAoCarrinho(p); input.value = ''; }
                  }
                }}
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
            {categorias.map(c => {
              const nome = c.nome || c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoriaAtiva(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${categoriaAtiva === c.id ? 'bg-verdigris text-snow border-verdigris' : 'bg-graphite text-snow/70 border-transparent hover:border-pearl/30'}`}
                >
                  {nome}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
            {produtosFiltrados.map(p => {
              const nome = p.nome || p.name;
              const preco = p.preco ?? p.price;
              const estoque = p.estoque ?? p.stock;
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => adicionarAoCarrinho(p)}
                  className="text-left bg-graphite rounded-card p-3 card-shadow hover:ring-1 hover:ring-pearl/40 transition-all group"
                >
                  <MiniaturaProduto nome={nome} />
                  <p className="text-sm text-snow font-medium leading-tight line-clamp-2 min-h-[2.5rem]">{nome}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-verdigris font-semibold">{formatCurrency(preco)}</span>
                    <span className="text-xs text-snow/40">{estoque} un</span>
                  </div>
                </motion.button>
              );
            })}
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
            <span className="text-sm text-snow/50">{carrinho.reduce((s, i) => s + (i.quantidade ?? i.qty), 0)} itens</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence initial={false}>
              {carrinho.map(item => {
                const nome = item.nome || item.name;
                const preco = item.preco ?? item.price;
                const qtd = item.quantidade ?? item.qty;
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
                      <button onClick={() => alterarQuantidade(item.id, -1)} className="w-7 h-7 rounded-md bg-graphite-hover text-pearl flex items-center justify-center hover:bg-verdigris hover:text-snow transition-colors" aria-label="Diminuir">
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm text-snow">{qtd}</span>
                      <button onClick={() => alterarQuantidade(item.id, 1)} className="w-7 h-7 rounded-md bg-graphite-hover text-pearl flex items-center justify-center hover:bg-verdigris hover:text-snow transition-colors" aria-label="Aumentar">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm text-snow font-medium w-20 text-right">{formatCurrency(preco * qtd)}</span>
                    <button onClick={() => removerItem(item.id)} className="text-snow/30 hover:text-danger transition-colors" aria-label="Remover">
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
            <div className="flex items-center justify-between text-sm text-snow/60">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold text-snow">
              <span>Total</span>
              <span className="text-pearl">{formatCurrency(total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="h-10 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors" disabled={!carrinho.length}>
                Desconto
              </button>
              <button className="h-10 rounded-lg border border-danger/40 text-danger text-sm font-medium hover:bg-danger/15 transition-colors" disabled={!carrinho.length} onClick={() => setCarrinho([])}>
                Cancelar
              </button>
            </div>
            <button
              onClick={() => setModalPagamentoAberto(true)}
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
                    type="number"
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-11 bg-onyx text-snow rounded-lg px-4 border border-transparent focus:border-verdigris focus:outline-none"
                  />
                  {valorRecebido && (
                    <p className="text-sm text-snow/60 mt-2">Troco: <span className="text-pearl font-medium">{formatCurrency(troco)}</span></p>
                  )}
                </div>
              )}

              <button
                onClick={finalizarVenda}
                className="w-full h-12 rounded-lg bg-verdigris text-snow font-semibold hover:bg-verdigris-hover transition-colors"
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
