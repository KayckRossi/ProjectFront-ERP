// Gera o banco do modo demonstração: cadastros + histórico de ~6 meses relativo à data atual.
// O histórico passa pelas mesmas regras do domínio (vendas, caixa, compras, financeiro, auditoria),
// então estoque, financeiro, caixas e totais dos clientes ficam consistentes entre si.
import {
  abrirCaixa, cancelarCompra, cancelarVenda, criarCompra, criarTransacao, fecharCaixa,
  movimentarCaixa, receberCompra, registrarEvento, registrarVenda, resumoSessao,
} from './dominio/index.js';
import { CREDENCIAIS_DEMO } from './credenciais.js';
import { arredondar, calcularTotais } from '../../lib/dinheiro.js';
import { dataLocalISO } from '../../lib/datas.js';

export const VERSAO_BANCO = 3;

const SEMENTE = 20261010;
const MESES_DE_HISTORICO = 6;
const DIAS_DE_AUDITORIA = 7;

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

const USUARIOS = [
  { id: 'u1', nome: 'Administrador Nexora', email: 'admin@nexora.com', role: 'admin', ativo: true },
  { id: 'u2', nome: 'Patrícia Lima', email: 'gerente@nexora.com', role: 'gerente', ativo: true },
  { id: 'u3', nome: 'Lucas Ferreira', email: 'operador@nexora.com', role: 'operador', ativo: true },
  { id: 'u4', nome: 'Bruna Alves', email: 'bruna@nexora.com', role: 'operador', ativo: false },
];

// `produtos` e `peso` só orientam a geração das compras
const FORNECEDORES = [
  {
    id: 'f1', razaoSocial: 'Atacadão Central Distribuidora LTDA', nomeFantasia: 'Atacadão Central', cnpj: '11.222.333/0001-81',
    contato: 'Roberto Nunes', telefone: '(11) 4002-8922', email: 'vendas@atacadaocentral.com.br', prazoPagamentoDias: 28,
    observacoes: 'Entrega às segundas e quintas.', produtos: ['p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p13', 'p15', 'p16'], peso: 50,
  },
  {
    id: 'f2', razaoSocial: 'Distribuidora Bom Preço Bebidas LTDA', nomeFantasia: 'Distribuidora Bom Preço', cnpj: '22.333.444/0001-90',
    contato: 'Camila Rocha', telefone: '(11) 3555-1200', email: 'pedidos@bompreco.com.br', prazoPagamentoDias: 30,
    observacoes: '', produtos: ['p1', 'p2', 'p3'], peso: 25,
  },
  {
    id: 'f3', razaoSocial: 'Laticínios Serra Azul S.A.', nomeFantasia: 'Laticínios Serra Azul', cnpj: '33.444.555/0001-02',
    contato: 'Eduardo Prado', telefone: '(35) 3333-7788', email: 'comercial@serraazul.com.br', prazoPagamentoDias: 14,
    observacoes: 'Pedido mínimo de 24 unidades.', produtos: ['p14'], peso: 15,
  },
  {
    id: 'f4', razaoSocial: 'Panificadora Trigo Fino ME', nomeFantasia: 'Panificadora Trigo Fino', cnpj: '44.555.666/0001-13',
    contato: 'Antônio Faria', telefone: '(11) 2777-3030', email: 'trigofino@email.com', prazoPagamentoDias: 7,
    observacoes: 'Entrega diária pela manhã.', produtos: ['p11', 'p12'], peso: 10,
  },
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
  pdv: { exigirCaixaAberto: true },
  seguranca: { doisFatores: false },
};

// Vendas por dia da semana (domingo a sábado) antes da variação aleatória
const VENDAS_POR_DIA_DA_SEMANA = [6, 9, 9, 10, 11, 13, 15];
const FUNDO_DE_TROCO = 150;
const MOTIVOS_CANCELAMENTO = ['Cliente desistiu da compra', 'Produto com defeito', 'Erro no registro da venda'];

const clonar = (valor) => JSON.parse(JSON.stringify(valor));
const momento = (dia, horas, minutos = 0, segundos = 0) => new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horas, minutos, segundos);
const senhaDe = (email) => CREDENCIAIS_DEMO.find((c) => c.email === email)?.senha ?? 'nexora123';

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
  const sortearVarios = (lista, quantidade) => {
    const restantes = [...lista];
    return Array.from({ length: Math.min(quantidade, restantes.length) }, () => restantes.splice(inteiro(0, restantes.length - 1), 1)[0]);
  };
  return { proximo, inteiro, decimal, ponderado, sortearVarios };
}

function montarVenda(aleatorio) {
  const cliente = aleatorio.proximo() < 0.35 ? aleatorio.ponderado(CLIENTES, () => 1) : null;
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

function lancarDespesasDoDia(db, dia, aleatorio) {
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
}

// Compra de reposição de um fornecedor com valor próximo de `valorAlvo` (caixas de 6 unidades)
function montarCompra(aleatorio, valorAlvo) {
  const fornecedor = aleatorio.ponderado(FORNECEDORES, (f) => f.peso);
  const produtos = aleatorio.sortearVarios(PRODUTOS.filter((p) => fornecedor.produtos.includes(p.id)), aleatorio.inteiro(2, 5));
  const itens = produtos.map((p) => ({
    produtoId: p.id,
    quantidade: Math.max(6, Math.round(valorAlvo / produtos.length / p.custo / 6) * 6),
    custoUnitario: p.custo,
  }));
  return { fornecedorId: fornecedor.id, itens, observacoes: '' };
}

export function gerarBancoDemo(agora = new Date()) {
  const aleatorio = criarAleatorio(SEMENTE);
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - (MESES_DE_HISTORICO - 1), 1);
  const db = {
    versao: VERSAO_BANCO,
    criadoEm: agora.toISOString(),
    categorias: clonar(CATEGORIAS),
    // Estoque "infinito" durante a geração; o estoque atual é definido no final
    produtos: PRODUTOS.map(({ popularidade: _popularidade, ...produto }) => ({ ...produto, estoque: Number.MAX_SAFE_INTEGER })),
    clientes: CLIENTES.map(({ perfil: _perfil, ...cliente }) => ({ ...cliente, totalCompras: 0 })),
    usuarios: USUARIOS.map((u) => ({
      ...u,
      criadoEm: inicio.toISOString(),
      ultimoAcesso: u.ativo ? null : momento(inicio, 18).toISOString(),
      senhaDemo: senhaDe(u.email),
    })),
    fornecedores: FORNECEDORES.map(({ produtos: _produtos, peso: _peso, ...fornecedor }) => ({ ...fornecedor })),
    compras: [],
    caixas: [],
    vendas: [],
    pedidos: [],
    transacoes: [],
    auditoria: [],
    configuracoes: clonar(CONFIGURACOES_PADRAO),
    sequencias: {
      venda: 1000, pedido: 100, transacao: 0, produto: PRODUTOS.length, cliente: CLIENTES.length,
      usuario: USUARIOS.length, fornecedor: FORNECEDORES.length, compra: 200, caixa: 0, movimentoCaixa: 0, auditoria: 0,
    },
  };

  const usuario = (id) => db.usuarios.find((u) => u.id === id);
  const gerente = usuario('u2');
  const inicioAuditoria = new Date(agora.getTime() - DIAS_DE_AUDITORIA * 86_400_000);
  // A auditoria de exemplo cobre só os últimos dias, para não pesar o armazenamento do navegador
  const auditar = (evento, dados, quem, quando) => {
    if (quando >= inicioAuditoria && quando <= agora) registrarEvento(db, evento, dados, quem, quando);
  };

  for (const dia = new Date(inicio); dia <= agora; dia.setDate(dia.getDate() + 1)) {
    const mesesDesdeInicio = (dia.getFullYear() - inicio.getFullYear()) * 12 + dia.getMonth() - inicio.getMonth();
    const crescimento = 1 + 0.04 * mesesDesdeInicio;
    const diasAteHoje = Math.round((momento(agora, 12) - momento(dia, 12)) / 86_400_000);
    lancarDespesasDoDia(db, dia, aleatorio);

    // Compras de reposição às segundas e quintas, recebidas no mesmo dia
    if (dia.getDay() === 1 || dia.getDay() === 4) {
      const criadaEm = momento(dia, 8, 30);
      const recebidaEm = momento(dia, 10, 0);
      if (criadaEm <= agora) {
        const compra = criarCompra(db, montarCompra(aleatorio, aleatorio.decimal(350, 650) * crescimento), criadaEm, gerente);
        auditar('compra.criada', compra, gerente, criadaEm);
        if (recebidaEm <= agora) {
          auditar('compra.recebida', receberCompra(db, compra.id, { atualizarCusto: true }, recebidaEm, gerente), gerente, recebidaEm);
        }
      }
    }
    // Uma compra cancelada há 10 dias e uma aguardando entrega desde ontem
    if (diasAteHoje === 10) {
      const compra = criarCompra(db, montarCompra(aleatorio, 400), momento(dia, 9), gerente);
      auditar('compra.criada', compra, gerente, momento(dia, 9));
      auditar('compra.cancelada', cancelarCompra(db, compra.id, { motivo: 'Fornecedor sem estoque' }, momento(dia, 11)), gerente, momento(dia, 11));
    }
    if (diasAteHoje === 1) {
      const compra = criarCompra(db, { ...montarCompra(aleatorio, 500), observacoes: 'Entrega prevista para amanhã.' }, momento(dia, 16), gerente);
      auditar('compra.criada', compra, gerente, momento(dia, 16));
    }

    // Caixa do dia: operador nos dias úteis, gerente no fim de semana
    const abertura = momento(dia, 7, 50);
    if (abertura > agora) continue;
    const domingo = dia.getDay() === 0;
    const operador = usuario(domingo || dia.getDay() === 6 ? 'u2' : 'u3');
    operador.ultimoAcesso = abertura.toISOString();
    auditar('sessao.login', operador, operador, abertura);
    const caixa = abrirCaixa(db, { valorInicial: FUNDO_DE_TROCO }, operador, abertura);
    auditar('caixa.aberto', caixa, operador, abertura);
    const sessao = db.caixas.find((s) => s.id === caixa.id);

    const quantidade = Math.round((VENDAS_POR_DIA_DA_SEMANA[dia.getDay()] + aleatorio.inteiro(0, 3)) * crescimento);
    // Horários em segundos desde a meia-noite, dentro do expediente
    const horarios = Array.from({ length: quantidade }, () => aleatorio.inteiro(8 * 3600, (domingo ? 13 : 20) * 3600 - 1)).sort((a, b) => a - b);
    let sangriaFeita = false;

    for (const segundos of horarios) {
      const quando = momento(dia, 0, 0, segundos);
      if (quando > agora) break;
      // Sangria no meio do dia quando o caixa acumula muito dinheiro
      if (!sangriaFeita && segundos >= 14 * 3600) {
        sangriaFeita = true;
        if (resumoSessao(db, sessao).esperadoEmDinheiro > 450) {
          const horaSangria = momento(dia, 14);
          auditar('caixa.movimento', movimentarCaixa(db, { tipo: 'sangria', valor: 300, motivo: 'Depósito no cofre' }, operador, horaSangria), operador, horaSangria);
        }
      }
      const venda = registrarVenda(db, montarVenda(aleatorio), quando, operador);
      auditar('venda.registrada', venda, operador, quando);
      if (aleatorio.proximo() < 0.02) {
        const cancelamento = new Date(quando.getTime() + aleatorio.inteiro(2, 40) * 60_000);
        if (cancelamento <= agora) {
          const cancelada = cancelarVenda(db, venda.id, { motivo: aleatorio.ponderado(MOTIVOS_CANCELAMENTO, () => 1) }, cancelamento, gerente);
          auditar('venda.cancelada', cancelada, gerente, cancelamento);
        }
      }
    }

    // Fechamento com pequenas diferenças na conferência de vez em quando
    const fechamento = momento(dia, domingo ? 13 : 20, 15);
    if (fechamento <= agora) {
      const { esperadoEmDinheiro } = resumoSessao(db, sessao);
      const sorteio = aleatorio.proximo();
      const diferenca = sorteio < 0.8 ? 0 : sorteio < 0.92 ? -aleatorio.decimal(0.5, 5) : aleatorio.decimal(0.5, 3);
      const fechado = fecharCaixa(db, { valorContado: arredondar(esperadoEmDinheiro + diferenca) }, operador, fechamento);
      auditar('caixa.fechado', fechado, operador, fechamento);
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
