// Gera o banco do modo demonstração: cadastro base + histórico de ~6 meses relativo à data atual.
// O histórico é criado pelas mesmas regras do domínio (registrarVenda, cancelarVenda, criarTransacao),
// então estoque, financeiro, pedidos e total de compras dos clientes ficam consistentes entre si.
import { cancelarVenda, criarTransacao, registrarVenda } from './dominio.js';
import { calcularTotais } from '../../lib/dinheiro.js';
import { dataLocalISO } from '../../lib/datas.js';

export const VERSAO_BANCO = 2;

const SEMENTE = 20261010;
const MESES_DE_HISTORICO = 6;

const CATEGORIAS = [
  { id: 'bebidas', nome: 'Bebidas', cor: '#339989' },
  { id: 'alimentos', nome: 'Alimentos', cor: '#7DE2D1' },
  { id: 'limpeza', nome: 'Limpeza', cor: '#2A7A6E' },
  { id: 'higiene', nome: 'Higiene', cor: '#5CBBB0' },
  { id: 'padaria', nome: 'Padaria', cor: '#9AE8DB' },
];

// `popularidade` só influencia a geração do histórico e não é salva no produto
const PRODUTOS = [
  { id: 'p1', nome: 'Refrigerante Cola 2L', sku: 'BEB001', categoria: 'bebidas', custo: 4.5, preco: 8.99, estoque: 42, estoqueMinimo: 12, codigoBarras: '7891234560011', popularidade: 9 },
  { id: 'p2', nome: 'Suco de Laranja 1L', sku: 'BEB002', categoria: 'bebidas', custo: 5.0, preco: 11.5, estoque: 8, estoqueMinimo: 10, codigoBarras: '7891234560028', popularidade: 4 },
  { id: 'p3', nome: 'Água Mineral 500ml', sku: 'BEB003', categoria: 'bebidas', custo: 1.2, preco: 3.49, estoque: 120, estoqueMinimo: 24, codigoBarras: '7891234560035', popularidade: 8 },
  { id: 'p4', nome: 'Arroz Branco 5kg', sku: 'ALI001', categoria: 'alimentos', custo: 18.0, preco: 27.9, estoque: 35, estoqueMinimo: 8, codigoBarras: '7891234560042', popularidade: 7 },
  { id: 'p5', nome: 'Feijão Carioca 1kg', sku: 'ALI002', categoria: 'alimentos', custo: 6.5, preco: 9.99, estoque: 4, estoqueMinimo: 10, codigoBarras: '7891234560059', popularidade: 7 },
  { id: 'p6', nome: 'Macarrão Espaguete 500g', sku: 'ALI003', categoria: 'alimentos', custo: 3.2, preco: 6.49, estoque: 60, estoqueMinimo: 20, codigoBarras: '7891234560066', popularidade: 5 },
  { id: 'p7', nome: 'Detergente Líquido 500ml', sku: 'LIM001', categoria: 'limpeza', custo: 1.8, preco: 4.29, estoque: 0, estoqueMinimo: 15, codigoBarras: '7891234560073', popularidade: 4 },
  { id: 'p8', nome: 'Sabão em Pó 1kg', sku: 'LIM002', categoria: 'limpeza', custo: 8.0, preco: 14.9, estoque: 22, estoqueMinimo: 6, codigoBarras: '7891234560080', popularidade: 3 },
  { id: 'p9', nome: 'Shampoo Hidratante 350ml', sku: 'HIG001', categoria: 'higiene', custo: 7.5, preco: 15.9, estoque: 18, estoqueMinimo: 8, codigoBarras: '7891234560097', popularidade: 2 },
  { id: 'p10', nome: 'Creme Dental 90g', sku: 'HIG002', categoria: 'higiene', custo: 2.0, preco: 5.49, estoque: 50, estoqueMinimo: 12, codigoBarras: '7891234560103', popularidade: 4 },
  { id: 'p11', nome: 'Pão Francês kg', sku: 'PAD001', categoria: 'padaria', custo: 6.0, preco: 12.9, estoque: 30, estoqueMinimo: 10, codigoBarras: '7891234560110', popularidade: 9 },
  { id: 'p12', nome: 'Bolo de Chocolate fatia', sku: 'PAD002', categoria: 'padaria', custo: 3.5, preco: 8.5, estoque: 6, estoqueMinimo: 8, codigoBarras: '7891234560127', popularidade: 3 },
  { id: 'p13', nome: 'Café Torrado e Moído 500g', sku: 'ALI004', categoria: 'alimentos', custo: 11.2, preco: 18.9, estoque: 28, estoqueMinimo: 10, codigoBarras: '7891234560134', popularidade: 6 },
  { id: 'p14', nome: 'Leite Integral 1L', sku: 'BEB004', categoria: 'bebidas', custo: 3.9, preco: 5.99, estoque: 64, estoqueMinimo: 24, codigoBarras: '7891234560141', popularidade: 8 },
  { id: 'p15', nome: 'Papel Higiênico 12 rolos', sku: 'HIG003', categoria: 'higiene', custo: 13.5, preco: 21.9, estoque: 15, estoqueMinimo: 6, codigoBarras: '7891234560158', popularidade: 3 },
  { id: 'p16', nome: 'Biscoito Recheado 140g', sku: 'ALI005', categoria: 'alimentos', custo: 1.9, preco: 3.79, estoque: 9, estoqueMinimo: 12, codigoBarras: '7891234560165', popularidade: 5 },
];

// `perfil` define o padrão de compra no histórico (pessoa jurídica compra em maior volume)
const CLIENTES = [
  { id: 'c1', nome: 'Ana Beatriz Souza', documento: '123.456.789-00', telefone: '(11) 98765-4321', email: 'ana.souza@email.com', perfil: 'pf' },
  { id: 'c2', nome: 'Carlos Eduardo Lima', documento: '987.654.321-99', telefone: '(11) 91234-5678', email: 'carlos.lima@email.com', perfil: 'pf' },
  { id: 'c3', nome: 'Mercado Central LTDA', documento: '12.345.678/0001-90', telefone: '(11) 3333-4444', email: 'contato@mercadocentral.com', perfil: 'pj' },
  { id: 'c4', nome: 'Fernanda Oliveira', documento: '456.789.123-44', telefone: '(21) 99876-5432', email: 'fernanda.o@email.com', perfil: 'pf' },
  { id: 'c5', nome: 'João Pedro Alves', documento: '321.654.987-22', telefone: '(31) 98123-4567', email: 'joao.alves@email.com', perfil: 'pf' },
  { id: 'c6', nome: 'Loja do Bairro ME', documento: '98.765.432/0001-10', telefone: '(11) 2222-3333', email: 'vendas@lojadobairro.com', perfil: 'pj' },
  { id: 'c7', nome: 'Mariana Costa Ribeiro', documento: '654.321.987-55', telefone: '(41) 99988-7766', email: 'mariana.r@email.com', perfil: 'pf' },
  { id: 'c8', nome: 'Rafael Mendes', documento: '789.123.456-77', telefone: '(51) 98765-1234', email: 'rafael.m@email.com', perfil: 'pf' },
];

export const CONFIGURACOES_PADRAO = {
  loja: {
    nome: 'Nexora Market',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 3333-4444',
    endereco: 'Rua das Flores, 123 - Centro, São Paulo/SP',
  },
  notificacoes: { push: true, alertaEstoqueBaixo: true },
  impressao: { automatica: false, modelo: 'Térmica 80mm', mensagemRodape: 'Obrigado pela preferência! Volte sempre.' },
  seguranca: { doisFatores: false },
};

// Vendas por dia da semana (domingo a sábado) antes da variação aleatória
const VENDAS_POR_DIA_DA_SEMANA = [6, 9, 9, 10, 11, 13, 15];
const FORNECEDORES = ['Atacadão Central', 'Distribuidora Bom Preço', 'Laticínios Serra Azul', 'Panificadora Trigo Fino'];
const MOTIVOS_CANCELAMENTO = ['Cliente desistiu da compra', 'Produto com defeito', 'Erro no registro da venda'];

const clonar = (valor) => JSON.parse(JSON.stringify(valor));

// Gerador pseudoaleatório determinístico (mulberry32): mesma data = mesmo histórico
function criarAleatorio(semente) {
  let estado = semente >>> 0;
  const proximo = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const inteiro = (min, max) => min + Math.floor(proximo() * (max - min + 1));
  const decimal = (min, max) => Math.round((min + proximo() * (max - min)) * 100) / 100;
  const ponderado = (lista, peso) => {
    const total = lista.reduce((soma, item) => soma + peso(item), 0);
    let sorteio = proximo() * total;
    return lista.find((item) => (sorteio -= peso(item)) < 0) ?? lista[lista.length - 1];
  };
  return { proximo, inteiro, decimal, ponderado };
}

function montarVenda(aleatorio) {
  const temCliente = aleatorio.proximo() < 0.35;
  const cliente = temCliente ? aleatorio.ponderado(CLIENTES, () => 1) : null;
  const atacado = cliente?.perfil === 'pj';

  const quantidadeDeProdutos = atacado ? aleatorio.inteiro(3, 5) : aleatorio.ponderado([1, 2, 3, 4], (n) => [35, 35, 20, 10][n - 1]);
  const disponiveis = [...PRODUTOS];
  const itens = [];
  for (let i = 0; i < quantidadeDeProdutos; i += 1) {
    const produto = aleatorio.ponderado(disponiveis, (p) => p.popularidade);
    disponiveis.splice(disponiveis.indexOf(produto), 1);
    const quantidade = atacado ? aleatorio.inteiro(2, 5) : aleatorio.ponderado([1, 2, 3], (n) => [70, 22, 8][n - 1]);
    itens.push({ produtoId: produto.id, quantidade, preco: produto.preco });
  }

  const sorteioPagamento = aleatorio.proximo();
  const formaPagamento = atacado
    ? sorteioPagamento < 0.6 ? 'pix' : 'cartao'
    : sorteioPagamento < 0.4 ? 'pix' : sorteioPagamento < 0.8 ? 'cartao' : 'dinheiro';
  const descontoPercentual = aleatorio.proximo() < 0.08 ? aleatorio.ponderado([5, 10], () => 1) : 0;

  let valorRecebido = null;
  if (formaPagamento === 'dinheiro') {
    const { total } = calcularTotais(itens, descontoPercentual);
    valorRecebido = aleatorio.proximo() < 0.4 ? total : Math.ceil(total / 10) * 10 + (aleatorio.proximo() < 0.3 ? 10 : 0);
  }

  return {
    clienteId: cliente?.id ?? null,
    formaPagamento,
    descontoPercentual,
    valorRecebido,
    itens: itens.map(({ produtoId, quantidade }) => ({ produtoId, quantidade })),
  };
}

function lancarDespesasDoDia(db, dia, aleatorio, crescimento) {
  const data = dataLocalISO(dia);
  const lancar = (descricao, tipo, categoria, valor) => criarTransacao(db, { descricao, tipo, categoria, valor, data });
  const diaDoMes = dia.getDate();

  if (diaDoMes === 5) {
    lancar('Aluguel da loja', 'saida', 'Fixos', 2200);
    lancar('Folha de pagamento', 'saida', 'Pessoal', 2800);
  }
  if (diaDoMes === 8) lancar('Material de limpeza da loja', 'saida', 'Outros', aleatorio.decimal(80, 160));
  if (diaDoMes === 10) lancar('Conta de energia', 'saida', 'Fixos', aleatorio.decimal(430, 560));
  if (diaDoMes === 12) lancar('Conta de água', 'saida', 'Fixos', aleatorio.decimal(90, 140));
  if (diaDoMes === 15) lancar('Internet fibra', 'saida', 'Fixos', 149.9);
  if (diaDoMes === 20) {
    // Simples Nacional: 6% do faturamento do mês anterior
    const mesAnterior = dataLocalISO(new Date(dia.getFullYear(), dia.getMonth() - 1, 1)).slice(0, 7);
    const faturamento = db.transacoes
      .filter((t) => t.categoria === 'Vendas' && t.data.startsWith(mesAnterior))
      .reduce((soma, t) => soma + t.valor, 0);
    if (faturamento > 0) lancar('Simples Nacional (DAS)', 'saida', 'Impostos', Math.round(faturamento * 6) / 100);
  }
  if (diaDoMes === 25) lancar('Comissão de recargas e serviços', 'entrada', 'Serviços', aleatorio.decimal(120, 220));
  // Compras de mercadoria às segundas e quintas
  if (dia.getDay() === 1 || dia.getDay() === 4) {
    const fornecedor = aleatorio.ponderado(FORNECEDORES, () => 1);
    lancar(`Compra de mercadorias - ${fornecedor}`, 'saida', 'Fornecedores', Math.round(aleatorio.decimal(350, 650) * crescimento * 100) / 100);
  }
}

export function gerarBancoDemo(agora = new Date()) {
  const aleatorio = criarAleatorio(SEMENTE);
  const db = {
    versao: VERSAO_BANCO,
    criadoEm: agora.toISOString(),
    categorias: clonar(CATEGORIAS),
    // Estoque "infinito" durante a geração; o estoque atual é definido no final
    produtos: PRODUTOS.map(({ popularidade: _popularidade, ...produto }) => ({ ...produto, estoque: Number.MAX_SAFE_INTEGER })),
    clientes: CLIENTES.map(({ perfil: _perfil, ...cliente }) => ({ ...cliente, totalCompras: 0 })),
    vendas: [],
    pedidos: [],
    transacoes: [],
    configuracoes: clonar(CONFIGURACOES_PADRAO),
    sequencias: { venda: 1000, pedido: 100, transacao: 0, produto: PRODUTOS.length, cliente: CLIENTES.length },
  };

  const inicio = new Date(agora.getFullYear(), agora.getMonth() - (MESES_DE_HISTORICO - 1), 1);
  for (const dia = new Date(inicio); dia <= agora; dia.setDate(dia.getDate() + 1)) {
    const mesesDesdeInicio = (dia.getFullYear() - inicio.getFullYear()) * 12 + dia.getMonth() - inicio.getMonth();
    const crescimento = 1 + 0.04 * mesesDesdeInicio;
    lancarDespesasDoDia(db, dia, aleatorio, crescimento);

    const domingo = dia.getDay() === 0;
    const quantidade = Math.round((VENDAS_POR_DIA_DA_SEMANA[dia.getDay()] + aleatorio.inteiro(0, 3)) * crescimento);
    // Horários em segundos desde a meia-noite, dentro do expediente
    const abertura = 8 * 3600;
    const fechamento = (domingo ? 13 : 20) * 3600;
    const horarios = Array.from({ length: quantidade }, () => aleatorio.inteiro(abertura, fechamento - 1)).sort((a, b) => a - b);

    for (const segundos of horarios) {
      const momento = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, segundos);
      if (momento > agora) break;
      const venda = registrarVenda(db, montarVenda(aleatorio), momento);
      if (aleatorio.proximo() < 0.02) {
        const cancelamento = new Date(momento.getTime() + aleatorio.inteiro(2, 40) * 60_000);
        if (cancelamento <= agora) {
          cancelarVenda(db, venda.id, { motivo: aleatorio.ponderado(MOTIVOS_CANCELAMENTO, () => 1) }, cancelamento);
        }
      }
    }
  }

  // Estoque atual da loja (o histórico considera reposições ao longo do tempo)
  for (const produto of db.produtos) produto.estoque = PRODUTOS.find((p) => p.id === produto.id).estoque;

  // Kanban: mantém só os pedidos das últimas vendas (3 pendentes, 2 em preparo e o restante finalizado)
  const pedidosRecentes = new Set(
    db.vendas.filter((v) => v.status === 'Concluída').slice(-8).map((v) => v.pedidoId),
  );
  db.pedidos = db.pedidos
    .filter((p) => pedidosRecentes.has(p.id))
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .map((pedido, i) => ({ ...pedido, status: i < 3 ? 'pendente' : i < 5 ? 'em_preparo' : 'finalizado' }));

  return db;
}
