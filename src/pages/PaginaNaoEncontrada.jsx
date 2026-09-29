import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PaginaNaoEncontrada() {
  const location = useLocation();
  const nomePagina = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-onyx">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-pearl">404</h1>
          <div className="h-0.5 w-16 bg-verdigris mx-auto"></div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-snow">
            Página Não Encontrada
          </h2>
          <p className="text-snow/60 leading-relaxed">
            A rota <span className="font-medium text-pearl">"{nomePagina}"</span> não foi localizada nesta aplicação.
          </p>
        </div>

        {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
          <div className="mt-8 p-4 bg-graphite rounded-lg border border-[rgba(125,226,209,0.15)] text-left">
            <p className="text-sm font-medium text-snow">Nota do Administrador</p>
            <p className="text-sm text-snow/60 mt-1">
              Verifique se a rota solicitada foi registrada no arquivo de rotas central.
            </p>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-verdigris text-snow font-semibold hover:bg-verdigris-hover transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}
