// Endereço do Nexora Backoffice (outro repositório), definido em VITE_BACKOFFICE_URL.
// Só vale um endereço completo (http:// ou https://): sem ele, os links que levam ao backoffice não aparecem.
const valor = (import.meta.env.VITE_BACKOFFICE_URL || '').trim().replace(/\/+$/, '');
const URL_BACKOFFICE = /^https?:\/\/[^/]/i.test(valor) ? valor : '';

export const backofficeConfigurado = Boolean(URL_BACKOFFICE);

export const linkBackoffice = (caminho = '/') => (backofficeConfigurado ? `${URL_BACKOFFICE}${caminho}` : null);

// O backoffice abre em outra aba, para não perder o que está em andamento aqui (ex.: o carrinho do PDV)
export const propsLinkExterno = { target: '_blank', rel: 'noopener noreferrer' };

export const abrirExterno = (url) => window.open(url, '_blank', 'noopener,noreferrer');
