import { api, backendConfigurado, tokenStorage } from '@/api/http';

// Autenticação seguindo a seção 1 do CONTRATO_API_BACKEND.md.
// Em modo demonstração (sem VITE_API_URL) o usuário fica apenas no localStorage.
const CHAVE_USUARIO_DEMO = 'nexora_demo_user';

function salvarUsuarioDemo(usuario) {
  localStorage.setItem(CHAVE_USUARIO_DEMO, JSON.stringify(usuario));
  return usuario;
}

function usuarioDemo(email, nome) {
  return salvarUsuarioDemo({
    id: `demo-${Date.now()}`,
    email,
    nome: nome || email.split('@')[0] || 'Usuário',
    role: 'admin',
  });
}

function guardarSessao(resposta) {
  if (resposta?.access_token) tokenStorage.salvar(resposta.access_token);
  return resposta?.user ?? null;
}

export const authApi = {
  modoDemo: !backendConfigurado,

  async login(email, password) {
    if (!backendConfigurado) {
      return usuarioDemo(email, email === 'admin@nexora.com' ? 'Administrador Nexora' : undefined);
    }
    return guardarSessao(await api('/api/auth/login', { method: 'POST', body: { email, password }, autenticado: false }));
  },

  // Login social só existe na demonstração; o contrato não prevê OAuth
  loginDemoGoogle() {
    return usuarioDemo('admin.google@nexora.com', 'Usuário Google');
  },

  // Retorna true quando o backend exige confirmação do e-mail por código (OTP)
  async cadastrar(email, password) {
    if (!backendConfigurado) {
      usuarioDemo(email);
      return { precisaVerificar: false };
    }
    await api('/api/auth/register', { method: 'POST', body: { email, password }, autenticado: false });
    return { precisaVerificar: true };
  },

  async verificarOtp(email, otpCode) {
    return guardarSessao(await api('/api/auth/verify-otp', { method: 'POST', body: { email, otpCode }, autenticado: false }));
  },

  reenviarOtp(email) {
    return api('/api/auth/resend-otp', { method: 'POST', body: { email }, autenticado: false });
  },

  async solicitarRedefinicaoSenha(email) {
    if (!backendConfigurado) return;
    await api('/api/auth/forgot-password', { method: 'POST', body: { email }, autenticado: false });
  },

  async redefinirSenha(token, novaSenha) {
    if (!backendConfigurado) return;
    await api('/api/auth/reset-password', { method: 'POST', body: { token, password: novaSenha }, autenticado: false });
  },

  // Usuário da sessão atual, ou null se não houver sessão válida
  async usuarioAtual() {
    if (!backendConfigurado) {
      try {
        return JSON.parse(localStorage.getItem(CHAVE_USUARIO_DEMO)) || null;
      } catch {
        localStorage.removeItem(CHAVE_USUARIO_DEMO);
        return null;
      }
    }
    if (!tokenStorage.obter()) return null;
    try {
      return await api('/api/auth/me');
    } catch (erro) {
      if (erro.status === 401 || erro.status === 403) {
        tokenStorage.limpar();
        return null;
      }
      throw erro;
    }
  },

  logout() {
    tokenStorage.limpar();
    localStorage.removeItem(CHAVE_USUARIO_DEMO);
  },
};
