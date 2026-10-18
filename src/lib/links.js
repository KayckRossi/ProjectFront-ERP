// Endereço do Nexora Backoffice (outro repositório), definido em VITE_BACKOFFICE_URL.
// Sem ele, os links que levam ao backoffice não aparecem.
const URL_BACKOFFICE = (import.meta.env.VITE_BACKOFFICE_URL || '').replace(/\/+$/, '');

export const linkBackoffice = (caminho = '/') => (URL_BACKOFFICE ? `${URL_BACKOFFICE}${caminho}` : null);
