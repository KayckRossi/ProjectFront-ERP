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

// Com "Lembrar de mim" o token fica no localStorage (sobrevive a fechar o navegador);
// sem ele, no sessionStorage (some ao fechar a aba). Útil em computadores compartilhados, como o do caixa.
const lerDe = (armazenamento) => {
  try { return armazenamento.getItem(CHAVE_TOKEN); } catch { return null; }
};
const apagarDe = (armazenamento) => {
  try { armazenamento.removeItem(CHAVE_TOKEN); } catch { /* storage indisponível */ }
};

export const tokenStorage = {
  obter: () => lerDe(globalThis.localStorage) ?? lerDe(globalThis.sessionStorage),
  salvar: (token, { lembrar = true } = {}) => {
    tokenStorage.limpar();
    try { (lembrar ? localStorage : sessionStorage).setItem(CHAVE_TOKEN, token); } catch { /* storage indisponível */ }
  },
  limpar: () => {
    apagarDe(globalThis.localStorage);
    apagarDe(globalThis.sessionStorage);
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
  const token = autenticado ? tokenStorage.obter() : null;
  let status;
  let dados;

  if (!backendConfigurado) {
    // Modo demonstração: mesmo contrato, respondido dentro do navegador
    const { responderDemo } = await import('./demo/servidor.js');
    ({ status, corpo: dados } = await responderDemo(method, caminho, body, token));
  } else {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
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
    status = resposta.status;
    const texto = await resposta.text();
    try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
  }

  if (status >= 400) {
    if (status === 401 && token) {
      tokenStorage.limpar();
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
    throw new ApiError(mensagemDeErro(dados, status), status, dados);
  }
  return dados;
}
