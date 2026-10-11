// Utilitários de texto compartilhados entre as telas e o servidor de demonstração (apenas imports relativos).

export const somenteDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// Minúsculas e sem acentos, para buscas que ignoram acentuação ("cafe" encontra "Café")
export const normalizarTexto = (valor) =>
  String(valor ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const contemTexto = (valor, termo) => normalizarTexto(valor).includes(normalizarTexto(termo));
