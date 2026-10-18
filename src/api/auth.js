import { api, backendConfigurado, tokenStorage } from '@/api/http';

// Autenticação seguindo a seção 1 do CONTRATO_API_BACKEND.md.
// No modo demonstração as mesmas rotas são respondidas pelo servidor em src/api/demo/.
const CREDENCIAL_ADMIN_DEMO = { email: 'admin@nexora.com', password: 'admin123' };

function guardarSessao(resposta, opcoes) {
  if (resposta?.access_token) tokenStorage.salvar(resposta.access_token, opcoes);
  return resposta?.user ?? null;
}

export const authApi = {
  modoDemo: !backendConfigurado,

  // lembrar: false guarda a sessão só até fechar a aba ("Lembrar de mim" desmarcado)
  async login(email, password, { lembrar = true } = {}) {
    return guardarSessao(await api('/api/auth/login', { method: 'POST', body: { email, password }, autenticado: false }), { lembrar });
  },

  // Login social só existe na demonstração (entra como administrador); o contrato não prevê OAuth
  loginDemoGoogle() {
    return authApi.login(CREDENCIAL_ADMIN_DEMO.email, CREDENCIAL_ADMIN_DEMO.password);
  },

  // Retorna se o backend exige confirmar o e-mail por código (OTP)
  async cadastrar(email, password) {
    await api('/api/auth/register', { method: 'POST', body: { email, password }, autenticado: false });
    if (backendConfigurado) return { precisaVerificar: true };
    // Na demonstração não há e-mail: a conta já nasce ativa
    await authApi.login(email, password);
    return { precisaVerificar: false };
  },

  async verificarOtp(email, otpCode) {
    return guardarSessao(await api('/api/auth/verify-otp', { method: 'POST', body: { email, otpCode }, autenticado: false }));
  },

  reenviarOtp(email) {
    return api('/api/auth/resend-otp', { method: 'POST', body: { email }, autenticado: false });
  },

  solicitarRedefinicaoSenha(email) {
    return api('/api/auth/forgot-password', { method: 'POST', body: { email }, autenticado: false });
  },

  redefinirSenha(token, novaSenha) {
    return api('/api/auth/reset-password', { method: 'POST', body: { token, password: novaSenha }, autenticado: false });
  },

  // Usuário da sessão atual, ou null se não houver sessão válida
  async usuarioAtual() {
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
  },
};
