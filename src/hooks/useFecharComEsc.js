import { useEffect, useRef } from 'react';

// Pilha de janelas abertas: só a do topo responde ao Esc (ex.: confirmação aberta sobre um modal)
const pilhaDeJanelas = [];

export function useFecharComEsc(aoFechar) {
  const aoFecharRef = useRef(aoFechar);
  aoFecharRef.current = aoFechar;

  useEffect(() => {
    const id = Symbol('janela');
    pilhaDeJanelas.push(id);
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape' && pilhaDeJanelas[pilhaDeJanelas.length - 1] === id) aoFecharRef.current?.();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      pilhaDeJanelas.splice(pilhaDeJanelas.indexOf(id), 1);
      window.removeEventListener('keydown', aoTeclar);
    };
  }, []);
}
