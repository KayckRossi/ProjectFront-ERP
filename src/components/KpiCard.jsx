import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format';

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// `moeda` formata como R$ (sempre com centavos); sem ele, mostra um número inteiro
export default function KpiCard({ icon: Icon, label, value = 0, moeda = false, detalhe, accent = '#7DE2D1' }) {
  const animated = useCountUp(value);
  const display = moeda ? formatCurrency(animated) : Math.round(animated).toLocaleString('pt-BR');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-graphite rounded-card p-6 card-shadow border-l-4 border-verdigris overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-snow/50 font-medium">{label}</p>
          <p className="text-2xl font-semibold text-snow mt-2 tracking-tight">{display}</p>
          {detalhe && <p className="text-xs text-snow/40 mt-1">{detalhe}</p>}
        </div>
        <div className="w-11 h-11 rounded-lg bg-verdigris-light flex items-center justify-center">
          <Icon size={22} style={{ color: accent }} />
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-verdigris-light blur-xl opacity-60" />
    </motion.div>
  );
}
