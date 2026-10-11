import { describe, expect, it } from 'vitest';
import { dataISOValida, dataLocalISO, diferencaEmDias, periodoRapido, somarDias } from './datas.js';
import { arredondar, calcularTotais, lerValorMonetario } from './dinheiro.js';
import { mascaraCnpj, mascaraDocumento, mascaraTelefone } from './mascaras.js';
import { contemTexto, normalizarTexto, somenteDigitos } from './texto.js';
import { parseDate } from './utils.js';

// Simula a digitação caractere por caractere, como acontece no formulário
const digitar = (mascara, texto) => [...texto].reduce((atual, caractere) => mascara(atual + caractere), '');

describe('datas', () => {
  it('soma dias atravessando meses e anos', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('valida datas AAAA-MM-DD reais', () => {
    expect(dataISOValida('2026-02-28')).toBe(true);
    expect(dataISOValida('2026-02-30')).toBe(false);
    expect(dataISOValida('29/09/2026')).toBe(false);
    expect(dataISOValida(undefined)).toBe(false);
  });

  it('calcula períodos rápidos a partir de hoje', () => {
    const hoje = new Date(2026, 9, 11);
    expect(periodoRapido('hoje', hoje)).toEqual({ dataInicio: '2026-10-11', dataFim: '2026-10-11' });
    expect(periodoRapido('7dias', hoje)).toEqual({ dataInicio: '2026-10-05', dataFim: '2026-10-11' });
    expect(periodoRapido('mes', hoje)).toEqual({ dataInicio: '2026-10-01', dataFim: '2026-10-11' });
    expect(diferencaEmDias('2026-10-01', '2026-10-11')).toBe(10);
  });

  it('trata datas sem horário como data local (sem voltar um dia por causa do UTC)', () => {
    expect(parseDate('2026-09-29').getDate()).toBe(29);
    expect(dataLocalISO(parseDate('2026-09-29'))).toBe('2026-09-29');
  });
});

describe('dinheiro', () => {
  it('arredonda para centavos sem erro de ponto flutuante', () => {
    expect(arredondar(0.1 + 0.2)).toBe(0.3);
    expect(arredondar(1.005)).toBe(1.01);
  });

  it('calcula subtotal, desconto e total como o backend', () => {
    expect(calcularTotais([{ preco: 9.99, quantidade: 4 }], 10)).toEqual({ subtotal: 39.96, desconto: 4, total: 35.96 });
    expect(calcularTotais([{ preco: 8.99, quantidade: 3 }, { preco: 3.49, quantidade: 2 }], 0)).toEqual({ subtotal: 33.95, desconto: 0, total: 33.95 });
    expect(calcularTotais([], 15)).toEqual({ subtotal: 0, desconto: 0, total: 0 });
  });

  it('lê valores digitados com vírgula ou ponto', () => {
    expect(lerValorMonetario('10,50')).toBe(10.5);
    expect(lerValorMonetario('10.50')).toBe(10.5);
    expect(lerValorMonetario('1.234,56')).toBe(1234.56);
    expect(lerValorMonetario('')).toBe(0);
    expect(lerValorMonetario('abc')).toBe(0);
  });
});

describe('máscaras e texto', () => {
  it('formata CPF e CNPJ durante a digitação', () => {
    expect(digitar(mascaraDocumento, '12345678900')).toBe('123.456.789-00');
    expect(digitar(mascaraDocumento, '12345678000190')).toBe('12.345.678/0001-90');
    expect(digitar(mascaraCnpj, '12345678000190')).toBe('12.345.678/0001-90');
  });

  it('formata telefone fixo e celular', () => {
    expect(digitar(mascaraTelefone, '1133334444')).toBe('(11) 3333-4444');
    expect(digitar(mascaraTelefone, '11987654321')).toBe('(11) 98765-4321');
  });

  it('busca ignora acentos e maiúsculas', () => {
    expect(normalizarTexto('  Café TORRADO ')).toBe('cafe torrado');
    expect(contemTexto('Feijão Carioca', 'feijao')).toBe(true);
    expect(somenteDigitos('123.456.789-00')).toBe('12345678900');
  });
});
