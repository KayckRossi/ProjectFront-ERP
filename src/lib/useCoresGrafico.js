import { useTheme } from '@/lib/ThemeContext';

// Cores de eixos, grade e legenda dos gráficos Recharts de acordo com o tema
export function useCoresGrafico() {
  const { isDark } = useTheme();
  return {
    eixo: isDark ? 'rgba(255, 250, 251, 0.45)' : 'rgba(15, 23, 42, 0.60)',
    grade: isDark ? 'rgba(125, 226, 209, 0.08)' : 'rgba(15, 23, 42, 0.08)',
    bordaFatia: isDark ? '#2B2C28' : '#FFFFFF',
    legenda: isDark ? '#FFFAFB99' : '#0F172ACC',
    cursor: isDark ? 'rgba(125, 226, 209, 0.05)' : 'rgba(15, 23, 42, 0.05)',
  };
}
