import { afterEach, describe, expect, it, vi } from 'vitest';

// links.js lê VITE_BACKOFFICE_URL ao ser importado, então cada teste importa uma cópia nova do módulo
async function carregarLinks(url) {
  vi.resetModules();
  vi.stubEnv('VITE_BACKOFFICE_URL', url);
  return import('./links.js');
}

afterEach(() => vi.unstubAllEnvs());

describe('links para o Nexora Backoffice', () => {
  it('monta o endereço sem barra duplicada', async () => {
    const { backofficeConfigurado, linkBackoffice } = await carregarLinks('http://localhost:5174/');
    expect(backofficeConfigurado).toBe(true);
    expect(linkBackoffice()).toBe('http://localhost:5174/');
    expect(linkBackoffice('/compras?status=aberta')).toBe('http://localhost:5174/compras?status=aberta');
  });

  it('sem endereço ou com endereço sem http(s):// os links não aparecem', async () => {
    for (const url of ['', 'localhost:5174', '/backoffice', 'ftp://bo.exemplo.com']) {
      const { backofficeConfigurado, linkBackoffice } = await carregarLinks(url);
      expect(backofficeConfigurado, url).toBe(false);
      expect(linkBackoffice('/compras'), url).toBeNull();
    }
  });
});
