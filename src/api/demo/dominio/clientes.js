// Clientes (seção 4 do contrato)
import { EMAIL_VALIDO } from '../../../lib/mascaras.js';
import { normalizarTexto, somenteDigitos } from '../../../lib/texto.js';
import { falhar, proximo, texto } from './base.js';

const encontrarCliente = (db, id) => db.clientes.find((c) => c.id === id) ?? falhar(404, 'Cliente não encontrado.');

export function validarTelefone(telefone) {
  const digitos = somenteDigitos(telefone);
  if (digitos && (digitos.length < 10 || digitos.length > 11)) falhar(400, 'Telefone deve ter DDD e 8 ou 9 dígitos.');
}

export function validarEmailOpcional(email) {
  if (email && !EMAIL_VALIDO.test(email)) falhar(400, 'E-mail inválido.');
}

function validarCliente(db, dados, idAtual) {
  const nome = texto(dados?.nome);
  if (!nome) falhar(400, 'Informe o nome ou razão social.');
  const documento = texto(dados.documento);
  const digitosDocumento = somenteDigitos(documento);
  if (digitosDocumento && digitosDocumento.length !== 11 && digitosDocumento.length !== 14) {
    falhar(400, 'CPF deve ter 11 dígitos e CNPJ 14.');
  }
  if (digitosDocumento && db.clientes.some((c) => c.id !== idAtual && somenteDigitos(c.documento) === digitosDocumento)) {
    falhar(409, 'Já existe um cliente cadastrado com este documento.');
  }
  const telefone = texto(dados.telefone);
  validarTelefone(telefone);
  const email = texto(dados.email);
  validarEmailOpcional(email);
  return { nome, documento, telefone, email };
}

export function listarClientes(db, query = {}) {
  if (!query.busca) return db.clientes;
  const termo = normalizarTexto(query.busca);
  const digitos = somenteDigitos(query.busca);
  return db.clientes.filter(
    (c) =>
      normalizarTexto(c.nome).includes(termo) ||
      normalizarTexto(c.email).includes(termo) ||
      (digitos && somenteDigitos(c.documento).includes(digitos)),
  );
}

export function criarCliente(db, dados) {
  const validado = validarCliente(db, dados);
  const cliente = { id: `c${proximo(db, 'cliente')}`, ...validado, totalCompras: 0 };
  db.clientes.push(cliente);
  return cliente;
}

export function atualizarCliente(db, id, dados) {
  const cliente = encontrarCliente(db, id);
  Object.assign(cliente, validarCliente(db, dados, id));
  return cliente;
}

export function excluirCliente(db, id) {
  encontrarCliente(db, id);
  db.clientes = db.clientes.filter((c) => c.id !== id);
  return { sucesso: true, mensagem: 'Cliente removido com sucesso' };
}
