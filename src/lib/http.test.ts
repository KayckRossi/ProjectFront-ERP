import { afterEach, describe, expect, it, vi } from 'vitest';
import { aplicarApiDaUrl, obterApiUrl, reviverDatas, tokenStorage } from './http';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('endereço da API', () => {
  it('sem endereço o app fica em modo demonstração', () => {
    vi.stubEnv('VITE_API_URL', '');
    expect(obterApiUrl()).toBe('');
  });

  it('usa VITE_API_URL sem barra no fim e ignora valores sem http(s)://', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com/');
    expect(obterApiUrl()).toBe('https://api.exemplo.com');
    vi.stubEnv('VITE_API_URL', 'api.exemplo.com');
    expect(obterApiUrl()).toBe('');
  });

  it('?api= na URL troca o backend após confirmação e some da barra de endereço', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.history.replaceState(null, '', '/login?api=https://minha-api.ngrok-free.app&voltar=%2F');
    aplicarApiDaUrl();
    expect(obterApiUrl()).toBe('https://minha-api.ngrok-free.app');
    expect(window.location.search).toBe('?voltar=%2F');

    window.history.replaceState(null, '', '/?api=demo');
    aplicarApiDaUrl();
    expect(obterApiUrl()).toBe('');
  });

  it('?api= recusado ou inválido não muda nada', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    window.history.replaceState(null, '', '/?api=https://outro.com');
    aplicarApiDaUrl();
    window.history.replaceState(null, '', '/?api=javascript:alert(1)');
    aplicarApiDaUrl();
    expect(obterApiUrl()).toBe('');
  });
});

describe('sessão', () => {
  it('"Manter conectado" guarda no localStorage; sem ele, só até fechar a aba', () => {
    tokenStorage.salvar('a', true);
    expect(localStorage.getItem('nexo365_token')).toBe('a');
    tokenStorage.salvar('b', false);
    expect(localStorage.getItem('nexo365_token')).toBeNull();
    expect(sessionStorage.getItem('nexo365_token')).toBe('b');
    expect(tokenStorage.obter()).toBe('b');
    tokenStorage.limpar();
    expect(tokenStorage.obter()).toBeNull();
  });
});

describe('datas do JSON', () => {
  it('converte campos *At e *Date em ISO para Date, inclusive aninhados', () => {
    const r = reviverDatas({ createdAt: '2026-10-18T10:00:00.000Z', dueDate: '2026-11-01', name: '2026-10-18', items: [{ product: { updatedAt: '2026-10-18T10:00:00Z' } }] });
    expect(r.createdAt).toBeInstanceOf(Date);
    expect(r.dueDate).toBeInstanceOf(Date);
    expect(r.name).toBe('2026-10-18');
    expect(r.items[0].product.updatedAt).toBeInstanceOf(Date);
  });
});
