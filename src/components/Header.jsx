import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Sun, Moon, ChevronDown, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { backendConfigurado } from '@/api/http';
import BuscaGlobal from '@/components/BuscaGlobal';
import Notificacoes from '@/components/Notificacoes';

export default function Header({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, perfil, pode } = useAuth();
  const navigate = useNavigate();
  const name = user?.nome || user?.full_name || user?.email || 'Usuário';
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

      <BuscaGlobal />

      <div className="flex items-center gap-1 md:gap-2 ml-auto">
        {!backendConfigurado && (
          <span
            title="Os dados ficam salvos neste navegador. Defina VITE_API_URL para usar o backend."
            className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning border border-warning/30"
          >
            Modo demonstração
          </span>
        )}

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

        <Notificacoes />

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
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm text-snow truncate">{name}</p>
              <p className="text-xs text-snow/50 truncate">{perfil}{user?.email && name !== user.email ? ` · ${user.email}` : ''}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[rgba(125,226,209,0.10)]" />
            {pode('configuracoes.gerenciar') && (
              <DropdownMenuItem className="hover:bg-graphite-hover focus:bg-graphite-hover cursor-pointer" onClick={() => navigate('/configuracoes')}>
                <Settings size={16} className="mr-2 text-pearl" /> Configurações
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="hover:bg-graphite-hover focus:bg-graphite-hover cursor-pointer text-danger focus:text-danger" onClick={() => logout()}>
              <LogOut size={16} className="mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
