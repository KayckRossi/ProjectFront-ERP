import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { sair, useUsuarioAtual } from '@/lib/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  UserCheck,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Barcode,
  Settings,
  Menu,
  X,
  Wine,
  ChevronDown,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'PDV - Vendas', icon: ShoppingCart, path: '/pdv' },
  { label: 'Produtos', icon: Package, path: '/produtos' },
  { label: 'Clientes', icon: Users, path: '/clientes' },
  { label: 'Fornecedores', icon: Truck, path: '/fornecedores' },
  { label: 'Vendedores', icon: UserCheck, path: '/vendedores' },
  { label: 'Estoque', icon: Package, path: '/estoque' },
  { label: 'Contas a Receber', icon: ArrowDownCircle, path: '/contas-receber' },
  { label: 'Contas a Pagar', icon: ArrowUpCircle, path: '/contas-pagar' },
  { label: 'Recibos', icon: Receipt, path: '/recibos' },
  { label: 'Códigos de Barras', icon: Barcode, path: '/codigos-barras' },
  { label: 'Relatórios', icon: BarChart3, path: '/relatorios' },
  { label: 'Usuários', icon: Settings, path: '/usuarios' },
];

const PERFIS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedor',
  cashier: 'Caixa',
};

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: usuario } = useUsuarioAtual();

  const handleLogout = async () => {
    await sair(queryClient);
    navigate('/login', { replace: true });
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="p-2 bg-primary rounded-lg">
            <Wine className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">nexo365</h1>
            <p className="text-xs text-sidebar-foreground/60">Nuvex Tecnologia</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        'nav-item w-full justify-between',
                        item.children.some((child) => isActive(child.path)) &&
                          'nav-item-active'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {expandedItems.includes(item.label) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {expandedItems.includes(item.label) && (
                      <ul className="mt-1 ml-9 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.path}>
                            <Link
                              to={child.path}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'block px-3 py-2 text-sm rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
                                isActive(child.path) &&
                                  'bg-sidebar-accent text-sidebar-foreground'
                              )}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'nav-item',
                      isActive(item.path) && 'nav-item-active'
                    )}
                  >
                    <item.icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {(usuario?.name ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {usuario?.name ?? '...'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {usuario ? PERFIS[usuario.role] ?? usuario.role : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sair"
              aria-label="Sair"
              className="p-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
