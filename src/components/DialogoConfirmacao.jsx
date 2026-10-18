import { useId } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useFecharComEsc } from '@/hooks/useFecharComEsc';

// Confirmação de ação destrutiva (excluir, cancelar venda). Renderize dentro de <AnimatePresence>.
export default function DialogoConfirmacao({
  titulo,
  children,
  rotuloConfirmar = 'Excluir',
  rotuloProcessando = 'Excluindo...',
  rotuloVoltar = 'Cancelar',
  processando = false,
  onConfirmar,
  onCancelar,
  icone: Icone = Trash2,
}) {
  const idTitulo = useId();
  useFecharComEsc(onCancelar);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onCancelar} />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-graphite rounded-modal p-6 w-full max-w-sm card-shadow text-center"
      >
        <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-4">
          <Icone size={22} className="text-danger" />
        </div>
        <h3 id={idTitulo} className="text-snow font-semibold mb-1">{titulo}</h3>
        <div className="text-sm text-snow/50 mb-5">{children}</div>
        <div className="flex gap-3">
          <button onClick={onCancelar} className="flex-1 h-10 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm">
            {rotuloVoltar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={processando}
            className="flex-1 h-10 rounded-lg bg-danger text-snow hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processando ? rotuloProcessando : rotuloConfirmar}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
