// Cliente HTTP do backend próprio (ver CONTRATO_API_BACKEND.md).
// Sem VITE_API_URL o app roda em modo demonstração, sem chamadas de rede.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const backendConfigurado = Boolean(API_URL);

const CHAVE_TOKEN = 'nexora_token';

export const tokenStorage = {
  obter: () => {
    try { return localStorage.getItem(CHAVE_TOKEN); } catch { return null; }
  },
  salvar: (token) => {
    try { localStorage.setItem(CHAVE_TOKEN, token); } catch { /* storage indisponível */ }
  },
  limpar: () => {
    try { localStorage.removeItem(CHAVE_TOKEN); } catch { /* storage indisponível */ }
  },
};

export class ApiError extends Error {
  constructor(mensagem, status, dados) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.dados = dados;
  }
}

export async function api(caminho, { method = 'GET', body, autenticado = true } = {}) {
  if (!backendConfigurado) {
    throw new ApiError('Backend não configurado (defina VITE_API_URL).', 0);
  }

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = autenticado && tokenStorage.obter();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }

  const texto = await resposta.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }

  if (!resposta.ok) {
    const mensagem = dados?.mensagem || dados?.message || dados?.erro || `Erro ${resposta.status} ao acessar o servidor.`;
    throw new ApiError(mensagem, resposta.status, dados);
  }
  return dados;
}
