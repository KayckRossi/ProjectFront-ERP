import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as mock from '@/lib/mockData';

// Armazena os dados operacionais (produtos, clientes, vendas, pedidos e
// movimentações) em um único estado compartilhado entre as telas, persistido
// no localStorage enquanto o backend não estiver disponível.
const CHAVE_STORAGE = 'nexora_erp_dados_v1';

const ErpDataContext = createContext(null);

const dadosIniciais = () => ({
  produtos: mock.produtos,
  clientes: mock.clientes,
  pedidos: mock.pedidos,
  vendas: mock.vendasRecentes,
  transacoes: mock.transacoes,
});

function carregarDados() {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo) return { ...dadosIniciais(), ...JSON.parse(salvo) };
  } catch {
    // Dados corrompidos ou storage indisponível: volta para o mock
  }
  return dadosIniciais();
}

// Gera o próximo número sequencial a partir de ids como "v1024" ou "ped-106"
function proximoNumero(lista) {
  const numeros = lista.map(item => parseInt(String(item.id).replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return (numeros.length ? Math.max(...numeros) : 0) + 1;
}

function dataLocalISO(data = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

const ROTULOS_PAGAMENTO = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };

export function ErpDataProvider({ children }) {
  const [dados, setDados] = useState(carregarDados);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
    } catch {
      // Sem persistência (modo privado / cota excedida); o estado em memória segue válido
    }
  }, [dados]);

  const atualizar = useCallback((colecao, fn) => {
    setDados(prev => ({ ...prev, [colecao]: fn(prev[colecao]) }));
  }, []);

  const salvarProduto = useCallback((produto) => {
    atualizar('produtos', lista => {
      if (produto.id) return lista.map(p => p.id === produto.id ? { ...p, ...produto } : p);
      const id = `p${Date.now()}`;
      return [...lista, { ...produto, id, codigoBarras: produto.codigoBarras || `789${Date.now()}`.slice(0, 13) }];
    });
  }, [atualizar]);

  const excluirProduto = useCallback((id) => {
    atualizar('produtos', lista => lista.filter(p => p.id !== id));
  }, [atualizar]);

  const ajustarEstoque = useCallback((id, delta) => {
    atualizar('produtos', lista => lista.map(p => p.id === id ? { ...p, estoque: Math.max(0, (p.estoque ?? 0) + delta) } : p));
  }, [atualizar]);

  const salvarCliente = useCallback((cliente) => {
    atualizar('clientes', lista => {
      if (cliente.id) return lista.map(c => c.id === cliente.id ? { ...c, ...cliente } : c);
      return [...lista, { ...cliente, id: `c${Date.now()}`, totalCompras: 0 }];
    });
  }, [atualizar]);

  const excluirCliente = useCallback((id) => {
    atualizar('clientes', lista => lista.filter(c => c.id !== id));
  }, [atualizar]);

  const moverPedido = useCallback((id, status) => {
    atualizar('pedidos', lista => lista.map(p => p.id === id ? { ...p, status } : p));
  }, [atualizar]);

  const adicionarTransacao = useCallback((transacao) => {
    atualizar('transacoes', lista => [{ ...transacao, id: `t${Date.now()}` }, ...lista]);
  }, [atualizar]);

  // Registra uma venda do PDV: baixa estoque, gera venda, pedido no Kanban,
  // entrada no financeiro e acumula o total no cadastro do cliente.
  const registrarVenda = useCallback(({ itens, total, formaPagamento, clienteId }) => {
    const numeroVenda = proximoNumero(dados.vendas);
    setDados(prev => {
      const agora = new Date();
      const cliente = prev.clientes.find(c => c.id === clienteId);
      const nomeCliente = cliente?.nome || 'Consumidor final';
      const qtdItens = itens.reduce((s, i) => s + i.quantidade, 0);
      const qtdPorProduto = Object.fromEntries(itens.map(i => [i.id, i.quantidade]));

      return {
        ...prev,
        produtos: prev.produtos.map(p => qtdPorProduto[p.id]
          ? { ...p, estoque: Math.max(0, (p.estoque ?? 0) - qtdPorProduto[p.id]) }
          : p),
        clientes: cliente
          ? prev.clientes.map(c => c.id === cliente.id ? { ...c, totalCompras: (c.totalCompras ?? 0) + total } : c)
          : prev.clientes,
        vendas: [{
          id: `v${numeroVenda}`,
          cliente: nomeCliente,
          total,
          status: 'Concluída',
          itens: qtdItens,
          data: agora.toISOString(),
        }, ...prev.vendas],
        pedidos: [{
          id: `ped-${proximoNumero(prev.pedidos)}`,
          cliente: nomeCliente,
          total,
          status: 'pendente',
          itens: qtdItens,
          pagamento: ROTULOS_PAGAMENTO[formaPagamento] || formaPagamento,
          data: agora.toISOString(),
        }, ...prev.pedidos],
        transacoes: [{
          id: `t${Date.now()}`,
          descricao: `Venda PDV #${numeroVenda}`,
          tipo: 'entrada',
          valor: total,
          data: dataLocalISO(agora),
          categoria: 'Vendas',
        }, ...prev.transacoes],
      };
    });
    return numeroVenda;
  }, [dados.vendas]);

  const restaurarDadosDemo = useCallback(() => setDados(dadosIniciais()), []);

  const valor = useMemo(() => ({
    ...dados,
    categorias: mock.categorias,
    salvarProduto,
    excluirProduto,
    ajustarEstoque,
    salvarCliente,
    excluirCliente,
    moverPedido,
    adicionarTransacao,
    registrarVenda,
    restaurarDadosDemo,
  }), [dados, salvarProduto, excluirProduto, ajustarEstoque, salvarCliente, excluirCliente, moverPedido, adicionarTransacao, registrarVenda, restaurarDadosDemo]);

  return <ErpDataContext.Provider value={valor}>{children}</ErpDataContext.Provider>;
}

export function useErpData() {
  const context = useContext(ErpDataContext);
  if (!context) {
    throw new Error('useErpData must be used within an ErpDataProvider');
  }
  return context;
}

export { dataLocalISO };
