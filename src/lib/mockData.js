export const categorias = [
  { id: 'bebidas', nome: 'Bebidas', cor: '#339989' },
  { id: 'alimentos', nome: 'Alimentos', cor: '#7DE2D1' },
  { id: 'limpeza', nome: 'Limpeza', cor: '#2A7A6E' },
  { id: 'higiene', nome: 'Higiene', cor: '#5CBBB0' },
  { id: 'padaria', nome: 'Padaria', cor: '#9AE8DB' },
];

export const produtos = [
  { id: 'p1', nome: 'Refrigerante Cola 2L', sku: 'BEB001', categoria: 'bebidas', custo: 4.50, preco: 8.99, estoque: 42, estoqueMinimo: 12, codigoBarras: '7891234560011' },
  { id: 'p2', nome: 'Suco de Laranja 1L', sku: 'BEB002', categoria: 'bebidas', custo: 5.00, preco: 11.50, estoque: 8, estoqueMinimo: 10, codigoBarras: '7891234560028' },
  { id: 'p3', nome: 'Água Mineral 500ml', sku: 'BEB003', categoria: 'bebidas', custo: 1.20, preco: 3.49, estoque: 120, estoqueMinimo: 24, codigoBarras: '7891234560035' },
  { id: 'p4', nome: 'Arroz Branco 5kg', sku: 'ALI001', categoria: 'alimentos', custo: 18.00, preco: 27.90, estoque: 35, estoqueMinimo: 8, codigoBarras: '7891234560042' },
  { id: 'p5', nome: 'Feijão Carioca 1kg', sku: 'ALI002', categoria: 'alimentos', custo: 6.50, preco: 9.99, estoque: 4, estoqueMinimo: 10, codigoBarras: '7891234560059' },
  { id: 'p6', nome: 'Macarrão Espaguete 500g', sku: 'ALI003', categoria: 'alimentos', custo: 3.20, preco: 6.49, estoque: 60, estoqueMinimo: 20, codigoBarras: '7891234560066' },
  { id: 'p7', nome: 'Detergente Líquido 500ml', sku: 'LIM001', categoria: 'limpeza', custo: 1.80, preco: 4.29, estoque: 0, estoqueMinimo: 15, codigoBarras: '7891234560073' },
  { id: 'p8', nome: 'Sabão em Pó 1kg', sku: 'LIM002', categoria: 'limpeza', custo: 8.00, preco: 14.90, estoque: 22, estoqueMinimo: 6, codigoBarras: '7891234560080' },
  { id: 'p9', nome: 'Shampoo Hidratante 350ml', sku: 'HIG001', categoria: 'higiene', custo: 7.50, preco: 15.90, estoque: 18, estoqueMinimo: 8, codigoBarras: '7891234560097' },
  { id: 'p10', nome: 'Creme Dental 90g', sku: 'HIG002', categoria: 'higiene', custo: 2.00, preco: 5.49, estoque: 50, estoqueMinimo: 12, codigoBarras: '7891234560103' },
  { id: 'p11', nome: 'Pão Francês kg', sku: 'PAD001', categoria: 'padaria', custo: 6.00, preco: 12.90, estoque: 30, estoqueMinimo: 10, codigoBarras: '7891234560110' },
  { id: 'p12', nome: 'Bolo de Chocolate fatia', sku: 'PAD002', categoria: 'padaria', custo: 3.50, preco: 8.50, estoque: 6, estoqueMinimo: 8, codigoBarras: '7891234560127' },
];

export const clientes = [
  { id: 'c1', nome: 'Ana Beatriz Souza', documento: '123.456.789-00', telefone: '(11) 98765-4321', email: 'ana.souza@email.com', totalCompras: 2340.90 },
  { id: 'c2', nome: 'Carlos Eduardo Lima', documento: '987.654.321-99', telefone: '(11) 91234-5678', email: 'carlos.lima@email.com', totalCompras: 1890.50 },
  { id: 'c3', nome: 'Mercado Central LTDA', documento: '12.345.678/0001-90', telefone: '(11) 3333-4444', email: 'contato@mercadocentral.com', totalCompras: 12450.00 },
  { id: 'c4', nome: 'Fernanda Oliveira', documento: '456.789.123-44', telefone: '(21) 99876-5432', email: 'fernanda.o@email.com', totalCompras: 760.00 },
  { id: 'c5', nome: 'João Pedro Alves', documento: '321.654.987-22', telefone: '(31) 98123-4567', email: 'joao.alves@email.com', totalCompras: 3210.75 },
  { id: 'c6', nome: 'Loja do Bairro ME', documento: '98.765.432/0001-10', telefone: '(11) 2222-3333', email: 'vendas@lojadobairro.com', totalCompras: 8900.40 },
  { id: 'c7', nome: 'Mariana Costa Ribeiro', documento: '654.321.987-55', telefone: '(41) 99988-7766', email: 'mariana.r@email.com', totalCompras: 540.20 },
  { id: 'c8', nome: 'Rafael Mendes', documento: '789.123.456-77', telefone: '(51) 98765-1234', email: 'rafael.m@email.com', totalCompras: 1670.30 },
];

export const pedidos = [
  { id: 'ped-101', cliente: 'João Pedro Alves', total: 56.20, status: 'pendente', itens: 3, pagamento: 'PIX', data: '2026-09-29T14:40:00' },
  { id: 'ped-102', cliente: 'Fernanda Oliveira', total: 120.00, status: 'pendente', itens: 7, pagamento: 'Cartão', data: '2026-09-29T14:35:00' },
  { id: 'ped-103', cliente: 'Ana Beatriz Souza', total: 87.40, status: 'em_preparo', itens: 5, pagamento: 'Dinheiro', data: '2026-09-29T14:20:00' },
  { id: 'ped-104', cliente: 'Carlos Eduardo Lima', total: 210.50, status: 'em_preparo', itens: 9, pagamento: 'Cartão', data: '2026-09-29T14:15:00' },
  { id: 'ped-105', cliente: 'Mercado Central LTDA', total: 423.90, status: 'finalizado', itens: 18, pagamento: 'PIX', data: '2026-09-29T13:50:00' },
  { id: 'ped-106', cliente: 'Loja do Bairro ME', total: 340.75, status: 'finalizado', itens: 14, pagamento: 'Cartão', data: '2026-09-29T13:30:00' },
];

export const vendasRecentes = [
  { id: 'v1024', cliente: 'Ana Beatriz Souza', total: 87.40, status: 'Concluída', itens: 5, data: '2026-09-29T14:32:00' },
  { id: 'v1023', cliente: 'Mercado Central LTDA', total: 423.90, status: 'Concluída', itens: 18, data: '2026-09-29T13:10:00' },
  { id: 'v1022', cliente: 'João Pedro Alves', total: 56.20, status: 'Pendente', itens: 3, data: '2026-09-29T12:45:00' },
  { id: 'v1021', cliente: 'Fernanda Oliveira', total: 120.00, status: 'Cancelada', itens: 7, data: '2026-09-29T11:20:00' },
  { id: 'v1020', cliente: 'Carlos Eduardo Lima', total: 210.50, status: 'Concluída', itens: 9, data: '2026-09-29T10:05:00' },
  { id: 'v1019', cliente: 'Loja do Bairro ME', total: 340.75, status: 'Concluída', itens: 14, data: '2026-09-29T09:15:00' },
];

export const vendasPorDia = [
  { dia: '22/09', vendas: 1240 },
  { dia: '23/09', vendas: 980 },
  { dia: '24/09', vendas: 1560 },
  { dia: '25/09', vendas: 1320 },
  { dia: '26/09', vendas: 2100 },
  { dia: '27/09', vendas: 2890 },
  { dia: '28/09', vendas: 2450 },
  { dia: '29/09', vendas: 1870 },
];

export const vendasPorCategoria = [
  { nome: 'Bebidas', valor: 3420 },
  { nome: 'Alimentos', valor: 2890 },
  { nome: 'Limpeza', valor: 1240 },
  { nome: 'Higiene', valor: 980 },
  { nome: 'Padaria', valor: 760 },
];

export const transacoes = [
  { id: 't1', descricao: 'Venda PDV #1024', tipo: 'entrada', valor: 87.40, data: '2026-09-29', categoria: 'Vendas' },
  { id: 't2', descricao: 'Pagamento fornecedor', tipo: 'saida', valor: 1200.00, data: '2026-09-28', categoria: 'Fornecedores' },
  { id: 't3', descricao: 'Venda PDV #1020', tipo: 'entrada', valor: 210.50, data: '2026-09-29', categoria: 'Vendas' },
  { id: 't4', descricao: 'Aluguel loja', tipo: 'saida', valor: 2500.00, data: '2026-09-25', categoria: 'Fixos' },
  { id: 't5', descricao: 'Venda PDV #1019', tipo: 'entrada', valor: 340.75, data: '2026-09-29', categoria: 'Vendas' },
  { id: 't6', descricao: 'Conta de energia', tipo: 'saida', valor: 480.30, data: '2026-09-24', categoria: 'Fixos' },
  { id: 't7', descricao: 'Venda PDV #1015', tipo: 'entrada', valor: 156.90, data: '2026-09-28', categoria: 'Vendas' },
  { id: 't8', descricao: 'Salário funcionário', tipo: 'saida', valor: 1800.00, data: '2026-09-22', categoria: 'Pessoal' },
];

export const financeiroMensal = [
  { mes: 'Abr', receitas: 12400, despesas: 8200 },
  { mes: 'Mai', receitas: 13900, despesas: 7800 },
  { mes: 'Jun', receitas: 15200, despesas: 9100 },
  { mes: 'Jul', receitas: 14600, despesas: 8600 },
  { mes: 'Ago', receitas: 16800, despesas: 9400 },
  { mes: 'Set', receitas: 18300, despesas: 10100 },
];

export const produtosMaisVendidos = [
  { nome: 'Arroz Branco 5kg', vendas: 142, receita: 3961.80 },
  { nome: 'Refrigerante Cola 2L', vendas: 128, receita: 1150.72 },
  { nome: 'Feijão Carioca 1kg', vendas: 96, receita: 959.04 },
  { nome: 'Pão Francês kg', vendas: 84, receita: 1083.60 },
  { nome: 'Sabão em Pó 1kg', vendas: 67, receita: 998.30 },
];

export const melhoresClientes = [
  { nome: 'Mercado Central LTDA', total: 12450.00, compras: 38 },
  { nome: 'Loja do Bairro ME', total: 8900.40, compras: 27 },
  { nome: 'João Pedro Alves', total: 3210.75, compras: 14 },
  { nome: 'Ana Beatriz Souza', total: 2340.90, compras: 11 },
  { nome: 'Carlos Eduardo Lima', total: 1890.50, compras: 9 },
];
