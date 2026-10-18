// Usuários e autenticação (seções 1 e "Usuários" do contrato).
// No servidor de demonstração o token é "demo.<id do usuário>" e as senhas ficam em `senhaDemo`.
import { EMAIL_VALIDO } from '../../../lib/mascaras.js';
import { PERFIS } from '../../../lib/permissoes.js';
import { normalizarTexto } from '../../../lib/texto.js';
import { falhar, proximo, texto } from './base.js';

// Senha inicial dos usuários criados pelo backoffice no modo demonstração
export const SENHA_INICIAL_DEMO = 'nexora123';
const PREFIXO_TOKEN = 'demo.';

// Nunca devolve a senha
export const usuarioPublico = ({ senhaDemo: _senha, ...usuario }) => usuario;
const perfilAutenticado = (u) => ({ id: u.id, email: u.email, nome: u.nome, role: u.role });

const encontrarUsuario = (db, id) => db.usuarios.find((u) => u.id === id) ?? falhar(404, 'Usuário não encontrado.');
const mesmoEmail = (a, b) => normalizarTexto(a) === normalizarTexto(b);

export function usuarioDoToken(db, token) {
  if (!token?.startsWith(PREFIXO_TOKEN)) return null;
  const usuario = db.usuarios.find((u) => u.id === token.slice(PREFIXO_TOKEN.length));
  return usuario?.ativo ? usuario : null;
}

// ---------------------------------------------------------------- Autenticação

export function autenticar(db, dados, agora = new Date()) {
  const usuario = db.usuarios.find((u) => mesmoEmail(u.email, dados?.email));
  if (!usuario || !dados?.password || usuario.senhaDemo !== dados.password) falhar(401, 'E-mail ou senha incorretos.');
  if (!usuario.ativo) falhar(403, 'Usuário desativado. Fale com o administrador.');
  usuario.ultimoAcesso = agora.toISOString();
  return { access_token: `${PREFIXO_TOKEN}${usuario.id}`, user: perfilAutenticado(usuario) };
}

export const usuarioAutenticado = (usuario) => perfilAutenticado(usuario);

// Na demonstração o cadastro já cria um administrador ativo (sem verificação por e-mail)
export function cadastrar(db, dados, agora = new Date()) {
  const email = texto(dados?.email);
  if (!EMAIL_VALIDO.test(email)) falhar(400, 'Informe um e-mail válido.');
  if (String(dados?.password ?? '').length < 6) falhar(400, 'A senha deve ter pelo menos 6 caracteres.');
  if (db.usuarios.some((u) => mesmoEmail(u.email, email))) falhar(409, 'Já existe uma conta com este e-mail.');
  db.usuarios.push({
    id: `u${proximo(db, 'usuario')}`,
    nome: email.split('@')[0],
    email,
    role: 'admin',
    ativo: true,
    criadoEm: agora.toISOString(),
    ultimoAcesso: null,
    senhaDemo: dados.password,
  });
  return { sucesso: true, mensagem: 'Código de verificação enviado para o e-mail informado.', email };
}

// ---------------------------------------------------------------- Usuários (backoffice)

function validarUsuario(db, dados, idAtual) {
  const nome = texto(dados?.nome);
  if (!nome) falhar(400, 'Informe o nome do usuário.');
  const email = texto(dados.email);
  if (!EMAIL_VALIDO.test(email)) falhar(400, 'Informe um e-mail válido.');
  if (db.usuarios.some((u) => u.id !== idAtual && mesmoEmail(u.email, email))) falhar(409, 'Já existe um usuário com este e-mail.');
  if (!PERFIS[dados.role]) falhar(400, `Perfil inválido. Use: ${Object.keys(PERFIS).join(', ')}.`);
  return { nome, email, role: dados.role };
}

export function listarUsuarios(db, query = {}) {
  const termo = normalizarTexto(query.busca);
  return db.usuarios
    .filter(
      (u) =>
        (!termo || normalizarTexto(u.nome).includes(termo) || normalizarTexto(u.email).includes(termo)) &&
        (!query.role || u.role === query.role) &&
        (query.ativo == null || query.ativo === '' || String(u.ativo) === String(query.ativo)),
    )
    .map(usuarioPublico);
}

// O usuário criado recebe um e-mail para definir a senha (na demonstração, a senha inicial é SENHA_INICIAL_DEMO)
export function criarUsuario(db, dados, agora = new Date()) {
  const validado = validarUsuario(db, dados);
  const usuario = {
    id: `u${proximo(db, 'usuario')}`,
    ...validado,
    ativo: true,
    criadoEm: agora.toISOString(),
    ultimoAcesso: null,
    senhaDemo: SENHA_INICIAL_DEMO,
  };
  db.usuarios.push(usuario);
  return usuarioPublico(usuario);
}

export function atualizarUsuario(db, id, dados, usuarioLogado) {
  const usuario = encontrarUsuario(db, id);
  const validado = validarUsuario(db, dados, id);
  const ativo = dados.ativo ?? usuario.ativo;
  if (typeof ativo !== 'boolean') falhar(400, 'O campo "ativo" deve ser verdadeiro ou falso.');

  // Proteções para ninguém trancar o sistema
  if (id === usuarioLogado?.id && !ativo) falhar(409, 'Você não pode desativar o próprio usuário.');
  if (id === usuarioLogado?.id && validado.role !== usuario.role) falhar(409, 'Você não pode alterar o próprio perfil.');
  const continuaAdminAtivo = validado.role === 'admin' && ativo;
  const outrosAdmins = db.usuarios.filter((u) => u.id !== id && u.role === 'admin' && u.ativo).length;
  if (!continuaAdminAtivo && usuario.role === 'admin' && usuario.ativo && outrosAdmins === 0) {
    falhar(409, 'O sistema precisa de pelo menos um administrador ativo.');
  }

  Object.assign(usuario, validado, { ativo });
  return usuarioPublico(usuario);
}

// Envia o e-mail de redefinição de senha (na demonstração não há envio)
export function redefinirSenhaUsuario(db, id) {
  const usuario = encontrarUsuario(db, id);
  if (!usuario.ativo) falhar(409, 'Ative o usuário antes de redefinir a senha.');
  return { sucesso: true, mensagem: `E-mail de redefinição de senha enviado para ${usuario.email}.` };
}
