import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export function AcessoNegado() {
  const { perfil } = useAuth();
  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mb-4">
        <ShieldX size={26} className="text-warning" />
      </div>
      <h2 className="text-lg font-semibold text-snow">Acesso restrito</h2>
      <p className="text-sm text-snow/50 mt-1 max-w-md">
        Seu perfil{perfil ? ` (${perfil})` : ''} não tem acesso a esta área. Fale com um administrador se precisar dela.
      </p>
      <Link to="/" className="mt-6 h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors inline-flex items-center">
        Voltar ao início
      </Link>
    </div>
  );
}

// Mostra a tela só para perfis com a permissão (o backend também recusa com 403)
export default function RotaComPermissao({ permissao, children }) {
  const { pode } = useAuth();
  return pode(permissao) ? children : <AcessoNegado />;
}
