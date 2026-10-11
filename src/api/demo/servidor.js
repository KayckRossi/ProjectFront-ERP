// Servidor de demonstração: responde às mesmas rotas do CONTRATO_API_BACKEND.md dentro do navegador,
// usado quando VITE_API_URL não está definida. Os dados ficam no localStorage.
import * as dominio from './dominio.js';
import { gerarBancoDemo, VERSAO_BANCO } from './seed.js';

export const CHAVE_STORAGE = 'nexora_demo_banco';
const CHAVES_ANTIGAS = ['nexora_erp_dados_v1'];

// [método, caminho, status de sucesso, handler(db, requisição)]
// Rotas fixas devem vir antes das rotas com parâmetro equivalente (ex.: /vendas/recentes antes de /vendas/:id)
const ROTAS = [
  ['GET', '/api/categorias', 200, (db) => dominio.listarCategorias(db)],
  ['GET', '/api/produtos', 200, (db, r) => dominio.listarProdutos(db, r.query)],
  ['POST', '/api/produtos', 201, (db, r) => dominio.criarProduto(db, r.body)],
  ['PUT', '/api/produtos/:id', 200, (db, r) => dominio.atualizarProduto(db, r.params.id, r.body)],
  ['DELETE', '/api/produtos/:id', 200, (db, r) => dominio.excluirProduto(db, r.params.id)],

  ['GET', '/api/estoque', 200, (db, r) => dominio.listarEstoque(db, r.query)],
  ['POST', '/api/estoque/movimentacoes', 201, (db, r) => dominio.movimentarEstoque(db, r.body)],

  ['GET', '/api/clientes', 200, (db, r) => dominio.listarClientes(db, r.query)],
  ['POST', '/api/clientes', 201, (db, r) => dominio.criarCliente(db, r.body)],
  ['PUT', '/api/clientes/:id', 200, (db, r) => dominio.atualizarCliente(db, r.params.id, r.body)],
  ['DELETE', '/api/clientes/:id', 200, (db, r) => dominio.excluirCliente(db, r.params.id)],

  ['GET', '/api/vendas', 200, (db, r) => dominio.listarVendas(db, r.query, r.agora)],
  ['POST', '/api/vendas', 201, (db, r) => dominio.registrarVenda(db, r.body, r.agora)],
  ['GET', '/api/vendas/recentes', 200, (db, r) => dominio.vendasRecentes(db, r.query)],
  ['GET', '/api/vendas/:id', 200, (db, r) => dominio.obterVenda(db, r.params.id)],
  ['POST', '/api/vendas/:id/cancelar', 200, (db, r) => dominio.cancelarVenda(db, r.params.id, r.body, r.agora)],

  ['GET', '/api/pedidos', 200, (db, r) => dominio.listarPedidos(db, r.agora)],
  ['PATCH', '/api/pedidos/:id/status', 200, (db, r) => dominio.atualizarStatusPedido(db, r.params.id, r.body, r.agora)],

  ['GET', '/api/financeiro/transacoes', 200, (db, r) => dominio.listarTransacoes(db, r.query, r.agora)],
  ['POST', '/api/financeiro/transacoes', 201, (db, r) => dominio.criarTransacao(db, r.body)],
  ['GET', '/api/financeiro/mensal', 200, (db, r) => dominio.financeiroMensal(db, r.query, r.agora)],

  ['GET', '/api/dashboard/kpis', 200, (db, r) => dominio.kpisDashboard(db, r.agora)],
  ['GET', '/api/relatorios/vendas-por-dia', 200, (db, r) => dominio.vendasPorDia(db, r.query, r.agora)],
  ['GET', '/api/relatorios/vendas-por-categoria', 200, (db, r) => dominio.vendasPorCategoria(db, r.query, r.agora)],
  ['GET', '/api/relatorios/produtos-mais-vendidos', 200, (db, r) => dominio.produtosMaisVendidos(db, r.query, r.agora)],
  ['GET', '/api/relatorios/melhores-clientes', 200, (db, r) => dominio.melhoresClientes(db, r.query, r.agora)],

  ['GET', '/api/configuracoes', 200, (db) => dominio.obterConfiguracoes(db)],
  ['PUT', '/api/configuracoes', 200, (db, r) => dominio.salvarConfiguracoes(db, r.body)],
  // Na demonstração existe uma única sessão
  ['POST', '/api/auth/sessions/revoke-others', 200, () => ({ sucesso: true, sessoesEncerradas: 0 })],
];

function encontrarRota(metodo, caminho) {
  const segmentos = caminho.split('/').filter(Boolean);
  for (const [metodoRota, padrao, status, handler] of ROTAS) {
    if (metodoRota !== metodo) continue;
    const partes = padrao.split('/').filter(Boolean);
    if (partes.length !== segmentos.length) continue;
    const params = {};
    const corresponde = partes.every((parte, i) => {
      if (parte.startsWith(':')) {
        params[parte.slice(1)] = decodeURIComponent(segmentos[i]);
        return true;
      }
      return parte === segmentos[i];
    });
    if (corresponde) return { status, handler, params };
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

const copiar = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));

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
    // Retorna { status, corpo }, no mesmo formato de uma resposta HTTP
    responder(metodo, caminhoCompleto, body) {
      const url = new URL(caminhoCompleto, 'http://demo.local');
      const metodoNormalizado = metodo.toUpperCase();
      const rota = encontrarRota(metodoNormalizado, url.pathname);
      if (!rota) return { status: 404, corpo: { mensagem: `Rota não encontrada: ${metodoNormalizado} ${url.pathname}` } };
      try {
        const resultado = rota.handler(db, {
          params: rota.params,
          query: Object.fromEntries(url.searchParams),
          body: copiar(body) ?? {},
          agora: agora(),
        });
        if (metodoNormalizado !== 'GET') salvar(db);
        return { status: rota.status, corpo: copiar(resultado) };
      } catch (erro) {
        if (erro instanceof dominio.ErroApi) return { status: erro.status, corpo: { mensagem: erro.message } };
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

export async function responderDemo(metodo, caminho, body) {
  return obterServidor().responder(metodo, caminho, body);
}

export async function restaurarDadosDemo() {
  obterServidor().restaurar();
}
