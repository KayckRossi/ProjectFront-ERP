import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes,
  Users, Wallet, BarChart3, Settings, ChevronLeft, X
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pdv', label: 'Vendas / PDV', icon: ShoppingCart },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/estoque', label: 'Estoque', icon: Boxes },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }) {
  const width = collapsed ? 'w-20' : 'w-64';

  const content = (
    <div className={`flex h-full flex-col bg-onyx border-r border-[rgba(125,226,209,0.10)] transition-all duration-300 ${width}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-[rgba(125,226,209,0.10)] shrink-0">
        <div className="w-9 h-9 rounded-lg bg-verdigris flex items-center justify-center shrink-0 shadow-lg shadow-verdigris/20">
          <span className="text-snow font-bold text-lg">N</span>
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <p className="font-semibold text-snow leading-tight">Nexora</p>
            <p className="text-xs text-snow/50">ERP + PDV</p>
          </motion.div>
        )}
        <button
          onClick={onCloseMobile}
          className="ml-auto md:hidden text-snow/60 hover:text-pearl p-1"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'text-pearl bg-verdigris-light'
                    : 'text-snow/70 hover:text-snow hover:bg-graphite-hover'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-verdigris"
                    />
                  )}
                  <Icon size={20} className="shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex items-center justify-center gap-2 h-12 border-t border-[rgba(125,226,209,0.10)] text-snow/60 hover:text-pearl transition-colors"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        {!collapsed && <span className="text-xs">Recolher</span>}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block shrink-0">{content}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-full z-50 md:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
