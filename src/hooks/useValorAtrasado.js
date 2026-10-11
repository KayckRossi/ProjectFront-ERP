import { useEffect, useState } from 'react';

// Devolve o valor só depois de `atraso` ms sem mudanças (evita uma requisição por tecla digitada)
export function useValorAtrasado(valor, atraso = 300) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(temporizador);
  }, [valor, atraso]);
  return atrasado;
}
