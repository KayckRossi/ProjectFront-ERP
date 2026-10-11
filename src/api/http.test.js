import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function criarStorage() {
  const dados = new Map();
  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
  };
}

// http.js lê VITE_API_URL ao ser importado, então cada teste importa uma cópia nova do módulo
async function carregarHttp(urlApi) {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', urlApi);
  return import('./http.js');
}

const respostaJson = (status, corpo) => new Response(corpo === undefined ? '' : JSON.stringify(corpo), { status });

beforeEach(() => {
  vi.stubGlobal('localStorage', criarStorage());
  vi.stubGlobal('window', new EventTarget());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('cliente HTTP com backend configurado', () => {
  it('envia JSON e o token Bearer para a URL configurada', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respostaJson(201, { id: 'p1' }));
    vi.stubGlobal('fetch', fetchFalso);
    const { api, tokenStorage } = await carregarHttp('http://api.teste/');
    tokenStorage.salvar('token-123');

    const resultado = await api('/api/produtos', { method: 'POST', body: { nome: 'Café' } });

    expect(resultado).toEqual({ id: 'p1' });
    const [url, opcoes] = fetchFalso.mock.calls[0];
    expect(url).toBe('http://api.teste/api/produtos');
    expect(opcoes.method).toBe('POST');
    expect(opcoes.headers).toMatchObject({ Authorization: 'Bearer token-123', 'Content-Type': 'application/json' });
    expect(JSON.parse(opcoes.body)).toEqual({ nome: 'Café' });
  });

  it('usa a mesma origem quando VITE_API_URL é "/"', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respostaJson(200, []));
    vi.stubGlobal('fetch', fetchFalso);
    const { api, backendConfigurado } = await carregarHttp('/');
    await api('/api/categorias');
    expect(backendConfigurado).toBe(true);
    expect(fetchFalso.mock.calls[0][0]).toBe('/api/categorias');
  });

  it('transforma respostas de erro em ApiError com a mensagem do backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(409, { mensagem: 'SKU já usado' })));
    const { api, ApiError } = await carregarHttp('http://api.teste');
    const erro = await api('/api/produtos').catch((e) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ status: 409, message: 'SKU já usado' });
  });

  it('falha de rede vira erro com status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { api } = await carregarHttp('http://api.teste');
    await expect(api('/api/produtos')).rejects.toMatchObject({ status: 0 });
  });

  it('401 com token descarta o token e avisa que a sessão expirou', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(401, { mensagem: 'Token expirado' })));
    const { api, tokenStorage, EVENTO_SESSAO_EXPIRADA } = await carregarHttp('http://api.teste');
    const aoExpirar = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    tokenStorage.salvar('token-velho');

    await expect(api('/api/produtos')).rejects.toMatchObject({ status: 401 });
    expect(tokenStorage.obter()).toBeNull();
    expect(aoExpirar).toHaveBeenCalledTimes(1);
  });

  it('401 em requisição sem token (login errado) não dispara sessão expirada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(401, { mensagem: 'Credenciais inválidas' })));
    const { api, EVENTO_SESSAO_EXPIRADA } = await carregarHttp('http://api.teste');
    const aoExpirar = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    await expect(api('/api/auth/login', { method: 'POST', body: {}, autenticado: false })).rejects.toMatchObject({ status: 401 });
    expect(aoExpirar).not.toHaveBeenCalled();
  });

  it('monta parâmetros de consulta ignorando valores vazios', async () => {
    const { comParametros } = await carregarHttp('http://api.teste');
    expect(comParametros('/api/vendas', { dataInicio: '2026-10-01', status: '', clienteId: null, busca: 'ana maria' }))
      .toBe('/api/vendas?dataInicio=2026-10-01&busca=ana+maria');
    expect(comParametros('/api/vendas', {})).toBe('/api/vendas');
  });
});

describe('modo demonstração (sem VITE_API_URL)', () => {
  it('responde pelo servidor de demonstração, sem rede', async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal('fetch', fetchFalso);
    const { api, backendConfigurado } = await carregarHttp('');
    expect(backendConfigurado).toBe(false);
    const categorias = await api('/api/categorias');
    expect(categorias.length).toBeGreaterThan(0);
    await expect(api('/api/produtos/nao-existe', { method: 'PUT', body: {} })).rejects.toMatchObject({ status: 404 });
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
