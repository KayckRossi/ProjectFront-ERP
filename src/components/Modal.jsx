import { useId } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useFecharComEsc } from '@/hooks/useFecharComEsc';

// Janela modal com fundo escurecido; fecha com Esc, clique fora ou no X. Renderize dentro de <AnimatePresence>.
export default function Modal({ titulo, subtitulo, onClose, children, largura = 'max-w-md', className = '' }) {
  const idTitulo = useId();
  useFecharComEsc(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative bg-graphite rounded-modal p-6 w-full ${largura} card-shadow max-h-[90vh] overflow-y-auto ${className}`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-lg font-semibold text-snow">{titulo}</h2>
            {subtitulo && <p className="text-sm text-snow/50 mt-0.5">{subtitulo}</p>}
          </div>
          <button onClick={onClose} className="text-snow/50 hover:text-snow shrink-0" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
