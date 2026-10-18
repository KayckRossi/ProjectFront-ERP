// Servidor de demonstração: responde às mesmas rotas do CONTRATO_API_BACKEND.md dentro do navegador,
// usado quando VITE_API_URL não está definida. Os dados ficam no localStorage.
import * as d from './dominio/index.js';
import { pode } from '../../lib/permissoes.js';
import { gerarBancoDemo, VERSAO_BANCO } from './seed.js';

export const CHAVE_STORAGE = 'nexora_demo_banco';
const CHAVES_ANTIGAS = ['nexora_erp_dados_v1', 'nexora_demo_user'];

const naoUsadoNaDemo = () => {
  throw new d.ErroApi(400, 'No modo demonstração não há verificação por e-mail.');
};

// Cada rota declara:
//   permissao: exigida do usuário logado (ausente = qualquer usuário autenticado; publica = sem login)
//   status:    de sucesso (padrão 200; resposta null vira 204)
//   antes:     lê o registro antes de alterar (usado na auditoria de exclusões)
//   evento:    evento de auditoria registrado após alterações; `dadosEvento` escolhe o registro auditado
// Rotas fixas devem vir antes das rotas com parâmetro equivalente (ex.: /vendas/recentes antes de /vendas/:id)
const ROTAS = [
  // Autenticação
  { metodo: 'POST', caminho: '/api/auth/login', publica: true, executar: (db, r) => d.autenticar(db, r.body, r.agora), evento: 'sessao.login', dadosEvento: (res) => res.user, usuarioEvento: (res) => res.user },
  { metodo: 'POST', caminho: '/api/auth/register', publica: true, status: 201, executar: (db, r) => d.cadastrar(db, r.body, r.agora) },
  { metodo: 'POST', caminho: '/api/auth/verify-otp', publica: true, executar: naoUsadoNaDemo },
  { metodo: 'POST', caminho: '/api/auth/resend-otp', publica: true, executar: () => ({ sucesso: true }) },
  { metodo: 'POST', caminho: '/api/auth/forgot-password', publica: true, executar: () => ({ sucesso: true }) },
  { metodo: 'POST', caminho: '/api/auth/reset-password', publica: true, executar: () => ({ sucesso: true }) },
  { metodo: 'GET', caminho: '/api/auth/me', executar: (db, r) => d.usuarioAutenticado(r.usuario) },
  // Na demonstração existe uma única sessão por usuário
  { metodo: 'POST', caminho: '/api/auth/sessions/revoke-others', executar: () => ({ sucesso: true, sessoesEncerradas: 0 }), evento: 'sessao.encerrar-outras' },

  // Usuários
  { metodo: 'GET', caminho: '/api/usuarios', permissao: 'usuarios.gerenciar', executar: (db, r) => d.listarUsuarios(db, r.query) },
  { metodo: 'POST', caminho: '/api/usuarios', permissao: 'usuarios.gerenciar', status: 201, executar: (db, r) => d.criarUsuario(db, r.body, r.agora), evento: 'usuario.criado' },
  { metodo: 'PUT', caminho: '/api/usuarios/:id', permissao: 'usuarios.gerenciar', executar: (db, r) => d.atualizarUsuario(db, r.params.id, r.body, r.usuario), evento: 'usuario.alterado' },
  { metodo: 'POST', caminho: '/api/usuarios/:id/redefinir-senha', permissao: 'usuarios.gerenciar', antes: (db, r) => db.usuarios.find((u) => u.id === r.params.id), executar: (db, r) => d.redefinirSenhaUsuario(db, r.params.id), evento: 'usuario.senha', dadosEvento: (_res, _r, antes) => antes },

  // Categorias
  { metodo: 'GET', caminho: '/api/categorias', executar: (db) => d.listarCategorias(db) },
  { metodo: 'POST', caminho: '/api/categorias', permissao: 'categorias.gerenciar', status: 201, executar: (db, r) => d.criarCategoria(db, r.body), evento: 'categoria.criada' },
  { metodo: 'PUT', caminho: '/api/categorias/:id', permissao: 'categorias.gerenciar', executar: (db, r) => d.atualizarCategoria(db, r.params.id, r.body), evento: 'categoria.alterada' },
  { metodo: 'DELETE', caminho: '/api/categorias/:id', permissao: 'categorias.gerenciar', antes: (db, r) => db.categorias.find((c) => c.id === r.params.id), executar: (db, r) => d.excluirCategoria(db, r.params.id), evento: 'categoria.excluida', dadosEvento: (_res, _r, antes) => antes },

  // Produtos
  { metodo: 'GET', caminho: '/api/produtos', executar: (db, r) => d.listarProdutos(db, r.query) },
  { metodo: 'POST', caminho: '/api/produtos', permissao: 'produtos.gerenciar', status: 201, executar: (db, r) => d.criarProduto(db, r.body), evento: 'produto.criado' },
  { metodo: 'PUT', caminho: '/api/produtos/:id', permissao: 'produtos.gerenciar', executar: (db, r) => d.atualizarProduto(db, r.params.id, r.body), evento: 'produto.alterado' },
  { metodo: 'DELETE', caminho: '/api/produtos/:id', permissao: 'produtos.gerenciar', antes: (db, r) => db.produtos.find((p) => p.id === r.params.id), executar: (db, r) => d.excluirProduto(db, r.params.id), evento: 'produto.excluido', dadosEvento: (_res, _r, antes) => antes },

  // Estoque
  { metodo: 'GET', caminho: '/api/estoque', executar: (db, r) => d.listarEstoque(db, r.query) },
  { metodo: 'POST', caminho: '/api/estoque/movimentacoes', permissao: 'estoque.gerenciar', status: 201, executar: (db, r) => d.movimentarEstoque(db, r.body), evento: 'estoque.movimentado', dadosEvento: (res, r) => ({ produto: res, tipo: r.body.tipo, quantidade: r.body.quantidade }) },

  // Clientes
  { metodo: 'GET', caminho: '/api/clientes', executar: (db, r) => d.listarClientes(db, r.query) },
  { metodo: 'POST', caminho: '/api/clientes', permissao: 'clientes.gerenciar', status: 201, executar: (db, r) => d.criarCliente(db, r.body), evento: 'cliente.criado' },
  { metodo: 'PUT', caminho: '/api/clientes/:id', permissao: 'clientes.gerenciar', executar: (db, r) => d.atualizarCliente(db, r.params.id, r.body), evento: 'cliente.alterado' },
  { metodo: 'DELETE', caminho: '/api/clientes/:id', permissao: 'clientes.excluir', antes: (db, r) => db.clientes.find((c) => c.id === r.params.id), executar: (db, r) => d.excluirCliente(db, r.params.id), evento: 'cliente.excluido', dadosEvento: (_res, _r, antes) => antes },

  // Vendas
  { metodo: 'GET', caminho: '/api/vendas', permissao: 'vendas.ver', executar: (db, r) => d.listarVendas(db, r.query, r.agora) },
  { metodo: 'POST', caminho: '/api/vendas', permissao: 'pdv.operar', status: 201, executar: (db, r) => d.registrarVenda(db, r.body, r.agora, r.usuario), evento: 'venda.registrada' },
  { metodo: 'GET', caminho: '/api/vendas/recentes', permissao: 'dashboard.ver', executar: (db, r) => d.vendasRecentes(db, r.query) },
  { metodo: 'GET', caminho: '/api/vendas/:id', permissao: 'vendas.ver', executar: (db, r) => d.obterVenda(db, r.params.id) },
  { metodo: 'POST', caminho: '/api/vendas/:id/cancelar', permissao: 'vendas.cancelar', executar: (db, r) => d.cancelarVenda(db, r.params.id, r.body, r.agora, r.usuario), evento: 'venda.cancelada' },

  // Pedidos (Kanban)
  { metodo: 'GET', caminho: '/api/pedidos', permissao: 'pdv.operar', executar: (db, r) => d.listarPedidos(db, r.agora) },
  { metodo: 'PATCH', caminho: '/api/pedidos/:id/status', permissao: 'pdv.operar', executar: (db, r) => d.atualizarStatusPedido(db, r.params.id, r.body, r.agora), evento: 'pedido.movido' },

  // Caixa
  { metodo: 'GET', caminho: '/api/caixa/atual', permissao: 'pdv.operar', executar: (db, r) => d.caixaAtual(db, r.usuario) },
  { metodo: 'POST', caminho: '/api/caixa/abrir', permissao: 'pdv.operar', status: 201, executar: (db, r) => d.abrirCaixa(db, r.body, r.usuario, r.agora), evento: 'caixa.aberto' },
  { metodo: 'POST', caminho: '/api/caixa/movimentos', permissao: 'pdv.operar', status: 201, executar: (db, r) => d.movimentarCaixa(db, r.body, r.usuario, r.agora), evento: 'caixa.movimento' },
  { metodo: 'POST', caminho: '/api/caixa/fechar', permissao: 'pdv.operar', executar: (db, r) => d.fecharCaixa(db, r.body, r.usuario, r.agora), evento: 'caixa.fechado' },
  { metodo: 'GET', caminho: '/api/caixa/sessoes', permissao: 'caixa.ver-todos', executar: (db, r) => d.listarSessoesCaixa(db, r.query, r.agora) },
  { metodo: 'GET', caminho: '/api/caixa/sessoes/:id', permissao: 'pdv.operar', executar: (db, r) => d.obterSessaoCaixa(db, r.params.id, r.usuario) },

  // Fornecedores
  { metodo: 'GET', caminho: '/api/fornecedores', permissao: 'fornecedores.gerenciar', executar: (db, r) => d.listarFornecedores(db, r.query) },
  { metodo: 'POST', caminho: '/api/fornecedores', permissao: 'fornecedores.gerenciar', status: 201, executar: (db, r) => d.criarFornecedor(db, r.body), evento: 'fornecedor.criado' },
  { metodo: 'PUT', caminho: '/api/fornecedores/:id', permissao: 'fornecedores.gerenciar', executar: (db, r) => d.atualizarFornecedor(db, r.params.id, r.body), evento: 'fornecedor.alterado' },
  { metodo: 'DELETE', caminho: '/api/fornecedores/:id', permissao: 'fornecedores.gerenciar', antes: (db, r) => db.fornecedores.find((f) => f.id === r.params.id), executar: (db, r) => d.excluirFornecedor(db, r.params.id), evento: 'fornecedor.excluido', dadosEvento: (_res, _r, antes) => antes },

  // Compras
  { metodo: 'GET', caminho: '/api/compras', permissao: 'compras.gerenciar', executar: (db, r) => d.listarCompras(db, r.query, r.agora) },
  { metodo: 'POST', caminho: '/api/compras', permissao: 'compras.gerenciar', status: 201, executar: (db, r) => d.criarCompra(db, r.body, r.agora, r.usuario), evento: 'compra.criada' },
  { metodo: 'GET', caminho: '/api/compras/:id', permissao: 'compras.gerenciar', executar: (db, r) => d.obterCompra(db, r.params.id) },
  { metodo: 'PUT', caminho: '/api/compras/:id', permissao: 'compras.gerenciar', executar: (db, r) => d.atualizarCompra(db, r.params.id, r.body), evento: 'compra.alterada' },
  { metodo: 'POST', caminho: '/api/compras/:id/receber', permissao: 'compras.gerenciar', executar: (db, r) => d.receberCompra(db, r.params.id, r.body, r.agora, r.usuario), evento: 'compra.recebida' },
  { metodo: 'POST', caminho: '/api/compras/:id/cancelar', permissao: 'compras.gerenciar', executar: (db, r) => d.cancelarCompra(db, r.params.id, r.body, r.agora), evento: 'compra.cancelada' },

  // Financeiro
  { metodo: 'GET', caminho: '/api/financeiro/transacoes', permissao: 'financeiro.ver', executar: (db, r) => d.listarTransacoes(db, r.query, r.agora) },
  { metodo: 'POST', caminho: '/api/financeiro/transacoes', permissao: 'financeiro.ver', status: 201, executar: (db, r) => d.criarTransacao(db, r.body), evento: 'transacao.lancada' },
  { metodo: 'GET', caminho: '/api/financeiro/mensal', permissao: 'financeiro.ver', executar: (db, r) => d.financeiroMensal(db, r.query, r.agora) },

  // Dashboard e relatórios
  { metodo: 'GET', caminho: '/api/dashboard/kpis', permissao: 'dashboard.ver', executar: (db, r) => d.kpisDashboard(db, r.agora) },
  { metodo: 'GET', caminho: '/api/relatorios/vendas-por-dia', permissao: 'relatorios.ver', executar: (db, r) => d.vendasPorDia(db, r.query, r.agora) },
  { metodo: 'GET', caminho: '/api/relatorios/vendas-por-categoria', permissao: 'relatorios.ver', executar: (db, r) => d.vendasPorCategoria(db, r.query, r.agora) },
  { metodo: 'GET', caminho: '/api/relatorios/produtos-mais-vendidos', permissao: 'relatorios.ver', executar: (db, r) => d.produtosMaisVendidos(db, r.query, r.agora) },
  { metodo: 'GET', caminho: '/api/relatorios/melhores-clientes', permissao: 'relatorios.ver', executar: (db, r) => d.melhoresClientes(db, r.query, r.agora) },

  // Configurações
  { metodo: 'GET', caminho: '/api/configuracoes', executar: (db) => d.obterConfiguracoes(db) },
  { metodo: 'PUT', caminho: '/api/configuracoes', permissao: 'configuracoes.gerenciar', executar: (db, r) => d.salvarConfiguracoes(db, r.body), evento: 'configuracoes.alteradas' },

  // Auditoria
  { metodo: 'GET', caminho: '/api/auditoria', permissao: 'auditoria.ver', executar: (db, r) => d.listarAuditoria(db, r.query, r.agora) },
];

function encontrarRota(metodo, caminho) {
  const segmentos = caminho.split('/').filter(Boolean);
  for (const rota of ROTAS) {
    if (rota.metodo !== metodo) continue;
    const partes = rota.caminho.split('/').filter(Boolean);
    if (partes.length !== segmentos.length) continue;
    const params = {};
    const corresponde = partes.every((parte, i) => {
      if (parte.startsWith(':')) {
        params[parte.slice(1)] = decodeURIComponent(segmentos[i]);
        return true;
      }
      return parte === segmentos[i];
    });
    if (corresponde) return { rota, params };
  }
  return null;
}

function storagePadrao() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.getItem(CHAVE_STORAGE);
      return localStorage;
    }
  } catch {
    // Storage bloqueado (modo privado restrito): usa memória
  }
  const memoria = new Map();
  return {
    getItem: (chave) => memoria.get(chave) ?? null,
    setItem: (chave, valor) => memoria.set(chave, String(valor)),
    removeItem: (chave) => memoria.delete(chave),
  };
}

const copiar = (valor) => (valor === undefined || valor === null ? valor : JSON.parse(JSON.stringify(valor)));

export function criarServidorDemo({ storage = storagePadrao(), agora = () => new Date() } = {}) {
  const salvar = (db) => {
    try {
      storage.setItem(CHAVE_STORAGE, JSON.stringify(db));
    } catch (erro) {
      console.warn('[demo] Não foi possível salvar os dados de demonstração no navegador:', erro);
    }
  };

  const carregar = () => {
    for (const chave of CHAVES_ANTIGAS) storage.removeItem(chave);
    try {
      const salvo = JSON.parse(storage.getItem(CHAVE_STORAGE));
      if (salvo?.versao === VERSAO_BANCO) return salvo;
    } catch {
      // Dados corrompidos: gera um banco novo
    }
    const novo = gerarBancoDemo(agora());
    salvar(novo);
    return novo;
  };

  let db = carregar();

  return {
    // `token` é o access_token do usuário (o mesmo enviado como Bearer ao backend real).
    // Retorna { status, corpo }, no mesmo formato de uma resposta HTTP.
    responder(metodo, caminhoCompleto, body, token) {
      const url = new URL(caminhoCompleto, 'http://demo.local');
      const metodoNormalizado = metodo.toUpperCase();
      const encontrada = encontrarRota(metodoNormalizado, url.pathname);
      if (!encontrada) return { status: 404, corpo: { mensagem: `Rota não encontrada: ${metodoNormalizado} ${url.pathname}` } };
      const { rota, params } = encontrada;
      const requisicao = { params, query: Object.fromEntries(url.searchParams), body: copiar(body) ?? {}, agora: agora() };

      try {
        if (!rota.publica) {
          requisicao.usuario = d.usuarioDoToken(db, token);
          if (!requisicao.usuario) return { status: 401, corpo: { mensagem: 'Sessão inválida ou expirada. Entre novamente.' } };
          if (rota.permissao && !pode(requisicao.usuario.role, rota.permissao)) {
            return { status: 403, corpo: { mensagem: 'Seu perfil não tem permissão para esta ação.' } };
          }
        }
        const antes = copiar(rota.antes?.(db, requisicao));
        const resultado = rota.executar(db, requisicao);
        if (metodoNormalizado !== 'GET') {
          if (rota.evento) {
            const dados = rota.dadosEvento ? rota.dadosEvento(resultado, requisicao, antes) : resultado;
            const usuario = rota.usuarioEvento ? rota.usuarioEvento(resultado) : requisicao.usuario;
            d.registrarEvento(db, rota.evento, dados, usuario, requisicao.agora);
          }
          salvar(db);
        }
        if (resultado === null) return { status: 204, corpo: null };
        return { status: rota.status ?? 200, corpo: copiar(resultado) };
      } catch (erro) {
        if (erro instanceof d.ErroApi) {
          // Ações recusadas também podem alterar dados (ex.: último acesso), então salva mesmo assim
          if (metodoNormalizado !== 'GET') salvar(db);
          return { status: erro.status, corpo: { mensagem: erro.message } };
        }
        console.error('[demo] Erro inesperado:', erro);
        return { status: 500, corpo: { mensagem: 'Erro inesperado no servidor de demonstração.' } };
      }
    },
    restaurar() {
      db = gerarBancoDemo(agora());
      salvar(db);
    },
    recarregar() {
      db = carregar();
    },
  };
}

let servidor;

function obterServidor() {
  if (!servidor) {
    servidor = criarServidorDemo();
    // Mantém abas diferentes do navegador sincronizadas
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (evento) => {
        if (evento.key === CHAVE_STORAGE) servidor.recarregar();
      });
    }
  }
  return servidor;
}

export async function responderDemo(metodo, caminho, body, token) {
  return obterServidor().responder(metodo, caminho, body, token);
}

export async function restaurarDadosDemo() {
  obterServidor().restaurar();
}
