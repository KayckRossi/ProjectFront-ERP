import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message = 'Nenhum registro encontrado' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-verdigris-light flex items-center justify-center mb-4">
        <PackageOpen size={28} className="text-pearl" />
      </div>
      <p className="text-snow/60 text-sm">{message}</p>
    </div>
  );
}
