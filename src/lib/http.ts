// Cliente HTTP único do app. Todas as telas falam com o backend por aqui.
//
// Endereço da API, em ordem de prioridade:
//   1. definido em tempo de execução (?api=https://... na URL, salvo no navegador)
//   2. VITE_API_URL no build
// Sem endereço, o app roda em modo demonstração (src/api/demo.ts responde às rotas).
import { responderDemo } from '@/api/demo';

const CHAVE_API = 'nexo365_api_url';
const CHAVE_TOKEN = 'nexo365_token';

const normalizar = (url: string | null | undefined) => (url || '').trim().replace(/\/+$/, '');
const urlValida = (url: string) => url === '/' || /^https?:\/\/[^/]/i.test(url);

function lerArmazenado(chave: string, armazenamento: Storage | undefined) {
  try { return armazenamento?.getItem(chave) ?? null; } catch { return null; }
}

export function obterApiUrl(): string {
  const salvo = normalizar(lerArmazenado(CHAVE_API, globalThis.localStorage));
  if (salvo && urlValida(salvo)) return salvo;
  const env = normalizar(import.meta.env.VITE_API_URL);
  return env && urlValida(env) ? env : '';
}

export const modoDemonstracao = () => !obterApiUrl();

// Troca o backend sem rebuild: ?api=https://minha-api.ngrok.app (ou ?api=demo para voltar ao modo demonstração)
export function aplicarApiDaUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('api')) return;
  const valor = normalizar(params.get('api'));
  params.delete('api');
  const limpa = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash;
  window.history.replaceState(null, '', limpa);

  if (valor === '' || valor === 'demo') {
    try { localStorage.removeItem(CHAVE_API); } catch { /* storage indisponível */ }
  } else if (urlValida(valor) && window.confirm(`Usar o backend em ${valor}?\n\nSuas credenciais de login serão enviadas para esse endereço.`)) {
    try { localStorage.setItem(CHAVE_API, valor); } catch { /* storage indisponível */ }
  } else {
    return;
  }
  tokenStorage.limpar();
}

// "Manter conectado": token no localStorage; sem isso, no sessionStorage (some ao fechar a aba)
export const tokenStorage = {
  obter: () => lerArmazenado(CHAVE_TOKEN, globalThis.localStorage) ?? lerArmazenado(CHAVE_TOKEN, globalThis.sessionStorage),
  salvar(token: string, lembrar = true) {
    tokenStorage.limpar();
    try { (lembrar ? localStorage : sessionStorage).setItem(CHAVE_TOKEN, token); } catch { /* storage indisponível */ }
  },
  limpar() {
    for (const armazenamento of [globalThis.localStorage, globalThis.sessionStorage]) {
      try { armazenamento?.removeItem(CHAVE_TOKEN); } catch { /* storage indisponível */ }
    }
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public detalhes?: unknown) {
    super(message);
  }
}

// O JSON não tem tipo data: campos *At e *Date em ISO voltam a ser Date, como os tipos esperam
const ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
export function reviverDatas<T>(valor: T): T {
  if (Array.isArray(valor)) return valor.map(reviverDatas) as T;
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    return Object.fromEntries(Object.entries(valor).map(([chave, v]) => [
      chave,
      typeof v === 'string' && /(At|Date)$/.test(chave) && ISO.test(v) ? new Date(v) : reviverDatas(v),
    ])) as T;
  }
  return valor;
}

const hostDe = (url: string) => { try { return new URL(url).hostname; } catch { return ''; } };

let aoExpirarSessao: () => void = () => {};
export const definirAoExpirarSessao = (fn: () => void) => { aoExpirarSessao = fn; };

interface Opcoes {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  autenticado?: boolean;
}

export async function api<T>(caminho: string, { method = 'GET', body, autenticado = true }: Opcoes = {}): Promise<T> {
  const base = obterApiUrl();
  const token = autenticado ? tokenStorage.obter() : null;

  if (!base) {
    try {
      return reviverDatas(await responderDemo<T>(method, caminho, body, token));
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401 && autenticado) {
        tokenStorage.limpar();
        aoExpirarSessao();
      }
      throw erro;
    }
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${base === '/' ? '' : base}${caminho}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Backend atrás do ngrok grátis: sem isto ele responde com a página de aviso em HTML
        ...(/\.ngrok(-free)?\.(app|io|dev)$/i.test(hostDe(base)) ? { 'ngrok-skip-browser-warning': '1' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique o endereço da API e o CORS.');
  }

  if (resposta.status === 401 && autenticado) {
    tokenStorage.limpar();
    aoExpirarSessao();
  }
  const texto = await resposta.text();
  const dados = texto ? (() => { try { return JSON.parse(texto); } catch { return texto; } })() : null;
  if (!resposta.ok) {
    const mensagem = (dados && typeof dados === 'object' && 'message' in dados && String(dados.message)) || `Erro ${resposta.status}`;
    throw new ApiError(resposta.status, mensagem, dados);
  }
  return reviverDatas(dados as T);
}
