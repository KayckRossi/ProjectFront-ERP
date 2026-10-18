import { useNavigate } from 'react-router-dom';
import { Bell, PackageX, AlertTriangle, Clock, CheckCircle2, ShoppingBasket } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEstoque } from '@/api/estoque';
import { usePedidos } from '@/api/pedidos';
import { useConfiguracoes } from '@/api/configuracoes';
import { useCompras } from '@/api/compras';
import { useAuth } from '@/lib/AuthContext';
import { abrirExterno, backofficeConfigurado, linkBackoffice } from '@/lib/links';

const plural = (quantidade, singular, pluralTexto) => `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;

// Sino do cabeçalho: alertas de estoque (se ativados nas Configurações), pedidos pendentes e
// compras aguardando recebimento. Cada alerta só aparece para quem pode agir sobre ele; o de compras
// leva ao Nexora Backoffice e só aparece quando VITE_BACKOFFICE_URL está definida.
export default function Notificacoes() {
  const navigate = useNavigate();
  const { pode } = useAuth();
  const { data: configuracoes } = useConfiguracoes();
  const alertaEstoqueAtivo = (configuracoes?.notificacoes?.alertaEstoqueBaixo ?? true) && pode('estoque.gerenciar');
  const { data: estoque = [] } = useEstoque({ enabled: alertaEstoqueAtivo });
  const { data: pedidos = [] } = usePedidos({ atualizarACada: 30_000, ativo: pode('pdv.operar') });
  const { data: comprasAbertas = [] } = useCompras({ status: 'aberta' }, { enabled: pode('compras.gerenciar') && backofficeConfigurado });

  const semEstoque = alertaEstoqueAtivo ? estoque.filter((p) => p.estoque === 0).length : 0;
  const estoqueBaixo = alertaEstoqueAtivo ? estoque.filter((p) => p.estoque > 0 && p.status !== 'OK').length : 0;
  const pendentes = pedidos.filter((p) => p.status === 'pendente').length;
  const aguardandoRecebimento = backofficeConfigurado ? comprasAbertas.length : 0;

  const alertas = [
    semEstoque > 0 && { id: 'sem-estoque', icone: PackageX, cor: 'text-danger', texto: `${plural(semEstoque, 'produto', 'produtos')} sem estoque`, destino: '/estoque?filtro=sem-estoque' },
    estoqueBaixo > 0 && { id: 'baixo', icone: AlertTriangle, cor: 'text-warning', texto: `${plural(estoqueBaixo, 'produto', 'produtos')} com estoque baixo`, destino: '/estoque?filtro=baixo' },
    pendentes > 0 && { id: 'pedidos', icone: Clock, cor: 'text-pearl', texto: `${plural(pendentes, 'pedido pendente', 'pedidos pendentes')} no Kanban`, destino: '/pdv?aba=pedidos' },
    aguardandoRecebimento > 0 && { id: 'compras', icone: ShoppingBasket, cor: 'text-warning', texto: `${plural(aguardandoRecebimento, 'compra aguardando', 'compras aguardando')} recebimento`, destino: linkBackoffice('/compras?status=aberta'), externo: true },
  ].filter(Boolean);
  const total = semEstoque + estoqueBaixo + pendentes + aguardandoRecebimento;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-snow/70 hover:text-pearl hover:bg-graphite-hover transition-colors outline-none"
        aria-label={total ? `Notificações: ${total} alertas` : 'Notificações: nenhum alerta'}
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-[10px] font-semibold leading-4 text-white ring-2 ring-graphite">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-graphite border-[rgba(125,226,209,0.15)] text-snow">
        <DropdownMenuLabel className="text-snow/60 text-xs font-normal">Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[rgba(125,226,209,0.10)]" />
        {alertas.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-snow/60">
            <CheckCircle2 size={16} className="text-pearl" /> Tudo em ordem por aqui.
          </div>
        ) : alertas.map(({ id, icone: Icone, cor, texto, destino, externo }) => (
          <DropdownMenuItem key={id} onClick={() => (externo ? abrirExterno(destino) : navigate(destino))} className="gap-2 py-2.5 cursor-pointer hover:bg-graphite-hover focus:bg-graphite-hover">
            <Icone size={16} className={cor} /> <span className="text-sm">{texto}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
