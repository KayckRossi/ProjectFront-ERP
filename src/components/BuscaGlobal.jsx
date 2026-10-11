import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, ShoppingCart, Receipt, Package, Boxes, Users, Wallet, BarChart3, Settings, Hash, User,
  Banknote, ShoppingBasket, Truck, Tags, UserCog, ScrollText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useProdutos } from '@/api/produtos';
import { useClientes } from '@/api/clientes';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/format';
import { contemTexto, somenteDigitos } from '@/lib/texto';

const PAGINAS = [
  { caminho: '/', rotulo: 'Dashboard', icone: LayoutDashboard, permissao: 'dashboard.ver' },
  { caminho: '/pdv', rotulo: 'PDV - Ponto de Venda', icone: ShoppingCart, permissao: 'pdv.operar' },
  { caminho: '/vendas', rotulo: 'Vendas', icone: Receipt, permissao: 'vendas.ver' },
  { caminho: '/produtos', rotulo: 'Produtos', icone: Package, permissao: 'produtos.gerenciar' },
  { caminho: '/estoque', rotulo: 'Estoque', icone: Boxes, permissao: 'estoque.gerenciar' },
  { caminho: '/clientes', rotulo: 'Clientes', icone: Users, permissao: 'clientes.gerenciar' },
  { caminho: '/financeiro', rotulo: 'Financeiro', icone: Wallet, permissao: 'financeiro.ver' },
  { caminho: '/relatorios', rotulo: 'Relatórios', icone: BarChart3, permissao: 'relatorios.ver' },
  { caminho: '/backoffice/caixa', rotulo: 'Caixa - abertura e fechamento', icone: Banknote, permissao: 'pdv.operar' },
  { caminho: '/backoffice/compras', rotulo: 'Compras e entrada de mercadorias', icone: ShoppingBasket, permissao: 'compras.gerenciar' },
  { caminho: '/backoffice/fornecedores', rotulo: 'Fornecedores', icone: Truck, permissao: 'fornecedores.gerenciar' },
  { caminho: '/backoffice/categorias', rotulo: 'Categorias', icone: Tags, permissao: 'categorias.gerenciar' },
  { caminho: '/backoffice/usuarios', rotulo: 'Usuários e permissões', icone: UserCog, permissao: 'usuarios.gerenciar' },
  { caminho: '/backoffice/auditoria', rotulo: 'Auditoria', icone: ScrollText, permissao: 'auditoria.ver' },
  { caminho: '/configuracoes', rotulo: 'Configurações', icone: Settings, permissao: 'configuracoes.gerenciar' },
];

const LIMITE_POR_GRUPO = 6;
const classeItem = 'gap-3 cursor-pointer rounded-md text-snow data-[selected=true]:bg-verdigris-light data-[selected=true]:text-pearl';

// Paleta de busca (Ctrl+K): páginas, produtos, clientes e vendas pelo número
export default function BuscaGlobal() {
  const navigate = useNavigate();
  const { pode } = useAuth();
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState('');
  // Os cadastros só são carregados quando a busca é aberta
  const buscaProdutos = pode('produtos.gerenciar');
  const buscaClientes = pode('clientes.gerenciar');
  const { data: produtos = [] } = useProdutos({ enabled: aberta && buscaProdutos });
  const { data: clientes = [] } = useClientes({ enabled: aberta && buscaClientes });

  useEffect(() => {
    const aoTeclar = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAberta((atual) => !atual);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  const mudarAberta = (valor) => {
    setAberta(valor);
    if (!valor) setTermo('');
  };

  const ir = (caminho) => {
    mudarAberta(false);
    navigate(caminho);
  };

  const busca = termo.trim();
  const numeroVenda = pode('vendas.ver') && /^#?\d+$/.test(busca) ? somenteDigitos(busca) : '';
  const paginas = PAGINAS.filter((p) => pode(p.permissao) && contemTexto(p.rotulo, busca));
  const produtosEncontrados = busca && buscaProdutos
    ? produtos.filter((p) => contemTexto(p.nome, busca) || contemTexto(p.sku, busca) || p.codigoBarras === busca).slice(0, LIMITE_POR_GRUPO)
    : [];
  const clientesEncontrados = busca && buscaClientes
    ? clientes.filter((c) => contemTexto(c.nome, busca) || (somenteDigitos(busca) && somenteDigitos(c.documento).includes(somenteDigitos(busca)))).slice(0, LIMITE_POR_GRUPO)
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => mudarAberta(true)}
        className="relative flex-1 max-w-xl h-10 bg-onyx text-snow/40 rounded-lg pl-10 pr-3 border border-snow/10 hover:border-pearl/30 transition-colors text-sm text-left flex items-center gap-2"
        aria-label="Abrir busca (Ctrl+K)"
      >
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
        <span className="truncate">Buscar produtos, clientes, vendas...</span>
        <kbd className="ml-auto hidden sm:inline-block px-1.5 py-0.5 rounded border border-snow/15 text-[10px] font-mono text-snow/50">Ctrl K</kbd>
      </button>

      <Dialog open={aberta} onOpenChange={mudarAberta}>
        <DialogContent className="p-0 gap-0 overflow-hidden max-w-xl bg-graphite border-[rgba(125,226,209,0.15)] text-snow top-[15%] translate-y-0 data-[state=open]:slide-in-from-top-[10%]">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <DialogDescription className="sr-only">Procure páginas, produtos, clientes ou o número de uma venda</DialogDescription>
          <Command shouldFilter={false} loop className="bg-graphite text-snow">
            <CommandInput
              value={termo}
              onValueChange={setTermo}
              placeholder="Produto, cliente, página ou nº da venda..."
              className="h-12 pr-8 text-snow placeholder:text-snow/40"
            />
            <CommandList className="max-h-[360px] p-1">
              <CommandEmpty className="py-8 text-center text-sm text-snow/50">Nada encontrado para "{busca}".</CommandEmpty>

              {numeroVenda && (
                <CommandGroup heading="Vendas">
                  <CommandItem value={`venda-${numeroVenda}`} onSelect={() => ir(`/vendas?numero=${numeroVenda}`)} className={classeItem}>
                    <Hash size={16} className="text-pearl" /> Abrir venda #{numeroVenda}
                  </CommandItem>
                </CommandGroup>
              )}

              {produtosEncontrados.length > 0 && (
                <CommandGroup heading="Produtos">
                  {produtosEncontrados.map((p) => (
                    <CommandItem key={p.id} value={`produto-${p.id}`} onSelect={() => ir(`/produtos?busca=${encodeURIComponent(p.nome)}`)} className={classeItem}>
                      <Package size={16} className="text-pearl" />
                      <span className="flex-1 truncate">{p.nome}</span>
                      <span className="text-xs text-snow/50">{formatCurrency(p.preco)} · {p.estoque} un</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {clientesEncontrados.length > 0 && (
                <CommandGroup heading="Clientes">
                  {clientesEncontrados.map((c) => (
                    <CommandItem key={c.id} value={`cliente-${c.id}`} onSelect={() => ir(`/clientes?busca=${encodeURIComponent(c.nome)}`)} className={classeItem}>
                      <User size={16} className="text-pearl" />
                      <span className="flex-1 truncate">{c.nome}</span>
                      <span className="text-xs text-snow/50 font-mono">{c.documento}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {paginas.length > 0 && (
                <CommandGroup heading="Páginas">
                  {paginas.map(({ caminho, rotulo, icone: Icone }) => (
                    <CommandItem key={caminho} value={`pagina-${caminho}`} onSelect={() => ir(caminho)} className={classeItem}>
                      <Icone size={16} className="text-pearl" /> {rotulo}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
