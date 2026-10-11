// Configurações da loja (seção 9 do contrato)
import { somenteDigitos } from '../../../lib/texto.js';
import { falhar, texto } from './base.js';

export const MODELOS_IMPRESSAO = ['Térmica 80mm', 'Térmica 58mm', 'A4'];

export const obterConfiguracoes = (db) => db.configuracoes;

export function salvarConfiguracoes(db, dados) {
  const loja = dados?.loja ?? {};
  const nome = texto(loja.nome);
  if (!nome) falhar(400, 'Informe o nome da loja.');
  const cnpj = texto(loja.cnpj);
  if (cnpj && somenteDigitos(cnpj).length !== 14) falhar(400, 'O CNPJ deve ter 14 dígitos.');
  const telefone = texto(loja.telefone);
  const digitosTelefone = somenteDigitos(telefone);
  if (digitosTelefone && (digitosTelefone.length < 10 || digitosTelefone.length > 11)) falhar(400, 'Telefone deve ter DDD e 8 ou 9 dígitos.');
  const modelo = dados?.impressao?.modelo ?? MODELOS_IMPRESSAO[0];
  if (!MODELOS_IMPRESSAO.includes(modelo)) falhar(400, `Modelo de impressão inválido. Use: ${MODELOS_IMPRESSAO.join(', ')}.`);

  db.configuracoes = {
    loja: { nome, cnpj, telefone, endereco: texto(loja.endereco) },
    notificacoes: {
      push: Boolean(dados?.notificacoes?.push),
      alertaEstoqueBaixo: Boolean(dados?.notificacoes?.alertaEstoqueBaixo),
    },
    impressao: {
      automatica: Boolean(dados?.impressao?.automatica),
      modelo,
      mensagemRodape: texto(dados?.impressao?.mensagemRodape),
    },
    // Ausente = exige caixa aberto (padrão mais seguro)
    pdv: { exigirCaixaAberto: dados?.pdv?.exigirCaixaAberto !== false },
    seguranca: { doisFatores: Boolean(dados?.seguranca?.doisFatores) },
  };
  return db.configuracoes;
}
