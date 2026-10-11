// Cliente HTTP do backend próprio (ver CONTRATO_API_BACKEND.md).
//
// VITE_API_URL:
//   - URL completa (ex.: http://localhost:3000): chamadas vão direto para o backend
//   - "/": mesma origem do front (proxy do Vite em desenvolvimento ou backend servindo o front)
//   - vazia: modo demonstração, respondido pelo servidor em src/api/demo/ dentro do navegador
const URL_CONFIGURADA = (import.meta.env.VITE_API_URL || '').trim();
const API_URL = URL_CONFIGURADA.replace(/\/+$/, '');

export const backendConfigurado = URL_CONFIGURADA !== '';

// Disparado quando o backend recusa o token (401) durante o uso do sistema
export const EVENTO_SESSAO_EXPIRADA = 'nexora:sessao-expirada';

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

// Monta "/api/vendas?dataInicio=...&status=..." ignorando parâmetros vazios
export function comParametros(caminho, parametros = {}) {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, valor);
  }
  const consulta = busca.toString();
  return consulta ? `${caminho}?${consulta}` : caminho;
}

const mensagemDeErro = (dados, status) =>
  dados?.mensagem || dados?.message || dados?.erro || `Erro ${status} ao acessar o servidor.`;

export async function api(caminho, { method = 'GET', body, autenticado = true } = {}) {
  if (!backendConfigurado) {
    const { responderDemo } = await import('./demo/servidor.js');
    const { status, corpo } = await responderDemo(method, caminho, body);
    if (status >= 400) throw new ApiError(mensagemDeErro(corpo, status), status, corpo);
    return corpo;
  }

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = autenticado ? tokenStorage.obter() : null;
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
    if (resposta.status === 401 && token) {
      tokenStorage.limpar();
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new ApiError(mensagemDeErro(dados, resposta.status), resposta.status, dados);
  }
  return dados;
}
