import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, Sun, Moon, ChevronDown, User, LogOut } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

export default function Header({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.full_name || user?.email || 'Usuário';
  const initial = (name || 'U')[0].toUpperCase();

  return (
    <header className="h-16 bg-graphite border-b border-[rgba(51,153,137,0.15)] flex items-center gap-3 px-4 md:px-6 shrink-0 z-30 transition-colors">
      <button
        onClick={onMenuClick}
        className="md:hidden text-snow/70 hover:text-pearl p-1 cursor-pointer"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
        <input
          type="text"
          placeholder="Buscar produtos, clientes, vendas..."
          aria-label="Buscar"
          className="w-full h-10 bg-onyx text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-snow/10 focus:border-verdigris focus:outline-none transition-colors text-sm"
        />
      </div>

      <div className="flex items-center gap-1 md:gap-2 ml-auto">
        {/* Dark / Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-snow/70 hover:text-pearl hover:bg-graphite-hover transition-colors cursor-pointer overflow-hidden"
          aria-label={isDark ? "Mudar para modo dia (claro)" : "Mudar para modo noite (escuro)"}
          title={isDark ? "Mudar para modo dia (claro)" : "Mudar para modo noite (escuro)"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'dark-sun' : 'light-moon'}
              initial={{ y: -14, opacity: 0, rotate: -70, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
              exit={{ y: 14, opacity: 0, rotate: 70, scale: 0.6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex items-center justify-center"
            >
              {isDark ? (
                <Sun size={18} className="text-warning drop-shadow-[0_0_6px_rgba(244,162,97,0.5)]" />
              ) : (
                <Moon size={18} className="text-pearl drop-shadow-[0_0_6px_rgba(13,148,136,0.35)]" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-snow/70 hover:text-pearl hover:bg-graphite-hover transition-colors"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-verdigris ring-2 ring-graphite" />
          <span className="sr-only">Novas notificações não lidas</span>
        </button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-lg hover:bg-graphite-hover transition-colors outline-none"
            aria-label={`Menu de perfil de ${name}`}
          >
            <div className="w-8 h-8 rounded-full bg-verdigris flex items-center justify-center text-snow font-semibold text-sm">
              {initial}
            </div>
            <span className="hidden sm:block text-sm text-snow/90 max-w-[140px] truncate">{name}</span>
            <ChevronDown size={16} className="text-snow/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-graphite border-[rgba(125,226,209,0.15)] text-snow">
            <DropdownMenuLabel className="text-snow/60 text-xs font-normal">{name}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[rgba(125,226,209,0.10)]" />
            <DropdownMenuItem className="hover:bg-graphite-hover focus:bg-graphite-hover cursor-pointer" onClick={() => navigate('/configuracoes')}>
              <User size={16} className="mr-2 text-pearl" /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-graphite-hover focus:bg-graphite-hover cursor-pointer text-danger focus:text-danger" onClick={() => logout()}>
              <LogOut size={16} className="mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
