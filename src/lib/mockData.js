export const categorias = [
  { id: 'bebidas', nome: 'Bebidas', name: 'Bebidas', cor: '#339989', color: '#339989' },
  { id: 'alimentos', nome: 'Alimentos', name: 'Alimentos', cor: '#7DE2D1', color: '#7DE2D1' },
  { id: 'limpeza', nome: 'Limpeza', name: 'Limpeza', cor: '#2A7A6E', color: '#2A7A6E' },
  { id: 'higiene', nome: 'Higiene', name: 'Higiene', cor: '#5CBBB0', color: '#5CBBB0' },
  { id: 'padaria', nome: 'Padaria', name: 'Padaria', cor: '#9AE8DB', color: '#9AE8DB' },
];

export const produtos = [
  { id: 'p1', nome: 'Refrigerante Cola 2L', name: 'Refrigerante Cola 2L', sku: 'BEB001', categoria: 'bebidas', category: 'bebidas', custo: 4.50, cost: 4.50, preco: 8.99, price: 8.99, estoque: 42, stock: 42, estoqueMinimo: 12, minStock: 12, codigoBarras: '7891234560011', barcode: '7891234560011' },
  { id: 'p2', nome: 'Suco de Laranja 1L', name: 'Suco de Laranja 1L', sku: 'BEB002', categoria: 'bebidas', category: 'bebidas', custo: 5.00, cost: 5.00, preco: 11.50, price: 11.50, estoque: 8, stock: 8, estoqueMinimo: 10, minStock: 10, codigoBarras: '7891234560028', barcode: '7891234560028' },
  { id: 'p3', nome: 'Água Mineral 500ml', name: 'Água Mineral 500ml', sku: 'BEB003', categoria: 'bebidas', category: 'bebidas', custo: 1.20, cost: 1.20, preco: 3.49, price: 3.49, estoque: 120, stock: 120, estoqueMinimo: 24, minStock: 24, codigoBarras: '7891234560035', barcode: '7891234560035' },
  { id: 'p4', nome: 'Arroz Branco 5kg', name: 'Arroz Branco 5kg', sku: 'ALI001', categoria: 'alimentos', category: 'alimentos', custo: 18.00, cost: 18.00, preco: 27.90, price: 27.90, estoque: 35, stock: 35, estoqueMinimo: 8, minStock: 8, codigoBarras: '7891234560042', barcode: '7891234560042' },
  { id: 'p5', nome: 'Feijão Carioca 1kg', name: 'Feijão Carioca 1kg', sku: 'ALI002', categoria: 'alimentos', category: 'alimentos', custo: 6.50, cost: 6.50, preco: 9.99, price: 9.99, estoque: 4, stock: 4, estoqueMinimo: 10, minStock: 10, codigoBarras: '7891234560059', barcode: '7891234560059' },
  { id: 'p6', nome: 'Macarrão Espaguete 500g', name: 'Macarrão Espaguete 500g', sku: 'ALI003', categoria: 'alimentos', category: 'alimentos', custo: 3.20, cost: 3.20, preco: 6.49, price: 6.49, estoque: 60, stock: 60, estoqueMinimo: 20, minStock: 20, codigoBarras: '7891234560066', barcode: '7891234560066' },
  { id: 'p7', nome: 'Detergente Líquido 500ml', name: 'Detergente Líquido 500ml', sku: 'LIM001', categoria: 'limpeza', category: 'limpeza', custo: 1.80, cost: 1.80, preco: 4.29, price: 4.29, estoque: 0, stock: 0, estoqueMinimo: 15, minStock: 15, codigoBarras: '7891234560073', barcode: '7891234560073' },
  { id: 'p8', nome: 'Sabão em Pó 1kg', name: 'Sabão em Pó 1kg', sku: 'LIM002', categoria: 'limpeza', category: 'limpeza', custo: 8.00, cost: 8.00, preco: 14.90, price: 14.90, estoque: 22, stock: 22, estoqueMinimo: 6, minStock: 6, codigoBarras: '7891234560080', barcode: '7891234560080' },
  { id: 'p9', nome: 'Shampoo Hidratante 350ml', name: 'Shampoo Hidratante 350ml', sku: 'HIG001', categoria: 'higiene', category: 'higiene', custo: 7.50, cost: 7.50, preco: 15.90, price: 15.90, estoque: 18, stock: 18, estoqueMinimo: 8, minStock: 8, codigoBarras: '7891234560097', barcode: '7891234560097' },
  { id: 'p10', nome: 'Creme Dental 90g', name: 'Creme Dental 90g', sku: 'HIG002', categoria: 'higiene', category: 'higiene', custo: 2.00, cost: 2.00, preco: 5.49, price: 5.49, estoque: 50, stock: 50, estoqueMinimo: 12, minStock: 12, codigoBarras: '7891234560103', barcode: '7891234560103' },
  { id: 'p11', nome: 'Pão Francês kg', name: 'Pão Francês kg', sku: 'PAD001', categoria: 'padaria', category: 'padaria', custo: 6.00, cost: 6.00, preco: 12.90, price: 12.90, estoque: 30, stock: 30, estoqueMinimo: 10, minStock: 10, codigoBarras: '7891234560110', barcode: '7891234560110' },
  { id: 'p12', nome: 'Bolo de Chocolate fatia', name: 'Bolo de Chocolate fatia', sku: 'PAD002', categoria: 'padaria', category: 'padaria', custo: 3.50, cost: 3.50, preco: 8.50, price: 8.50, estoque: 6, stock: 6, estoqueMinimo: 8, minStock: 8, codigoBarras: '7891234560127', barcode: '7891234560127' },
];

export const clientes = [
  { id: 'c1', nome: 'Ana Beatriz Souza', name: 'Ana Beatriz Souza', documento: '123.456.789-00', doc: '123.456.789-00', telefone: '(11) 98765-4321', phone: '(11) 98765-4321', email: 'ana.souza@email.com', totalCompras: 2340.90, totalPurchases: 2340.90 },
  { id: 'c2', nome: 'Carlos Eduardo Lima', name: 'Carlos Eduardo Lima', documento: '987.654.321-99', doc: '987.654.321-99', telefone: '(11) 91234-5678', phone: '(11) 91234-5678', email: 'carlos.lima@email.com', totalCompras: 1890.50, totalPurchases: 1890.50 },
  { id: 'c3', nome: 'Mercado Central LTDA', name: 'Mercado Central LTDA', documento: '12.345.678/0001-90', doc: '12.345.678/0001-90', telefone: '(11) 3333-4444', phone: '(11) 3333-4444', email: 'contato@mercadocentral.com', totalCompras: 12450.00, totalPurchases: 12450.00 },
  { id: 'c4', nome: 'Fernanda Oliveira', name: 'Fernanda Oliveira', documento: '456.789.123-44', doc: '456.789.123-44', telefone: '(21) 99876-5432', phone: '(21) 99876-5432', email: 'fernanda.o@email.com', totalCompras: 760.00, totalPurchases: 760.00 },
  { id: 'c5', nome: 'João Pedro Alves', name: 'João Pedro Alves', documento: '321.654.987-22', doc: '321.654.987-22', telefone: '(31) 98123-4567', phone: '(31) 98123-4567', email: 'joao.alves@email.com', totalCompras: 3210.75, totalPurchases: 3210.75 },
  { id: 'c6', nome: 'Loja do Bairro ME', name: 'Loja do Bairro ME', documento: '98.765.432/0001-10', doc: '98.765.432/0001-10', telefone: '(11) 2222-3333', phone: '(11) 2222-3333', email: 'vendas@lojadobairro.com', totalCompras: 8900.40, totalPurchases: 8900.40 },
  { id: 'c7', nome: 'Mariana Costa Ribeiro', name: 'Mariana Costa Ribeiro', documento: '654.321.987-55', doc: '654.321.987-55', telefone: '(41) 99988-7766', phone: '(41) 99988-7766', email: 'mariana.r@email.com', totalCompras: 540.20, totalPurchases: 540.20 },
  { id: 'c8', nome: 'Rafael Mendes', name: 'Rafael Mendes', documento: '789.123.456-77', doc: '789.123.456-77', telefone: '(51) 98765-1234', phone: '(51) 98765-1234', email: 'rafael.m@email.com', totalCompras: 1670.30, totalPurchases: 1670.30 },
];

export const pedidos = [
  { id: 'ped-101', cliente: 'João Pedro Alves', customer: 'João Pedro Alves', total: 56.20, status: 'pendente', itens: 3, items: 3, pagamento: 'PIX', payment: 'PIX', data: '2026-09-29T14:40:00', date: '2026-09-29T14:40:00' },
  { id: 'ped-102', cliente: 'Fernanda Oliveira', customer: 'Fernanda Oliveira', total: 120.00, status: 'pendente', itens: 7, items: 7, pagamento: 'Cartão', payment: 'Cartão', data: '2026-09-29T14:35:00', date: '2026-09-29T14:35:00' },
  { id: 'ped-103', cliente: 'Ana Beatriz Souza', customer: 'Ana Beatriz Souza', total: 87.40, status: 'em_preparo', itens: 5, items: 5, pagamento: 'Dinheiro', payment: 'Dinheiro', data: '2026-09-29T14:20:00', date: '2026-09-29T14:20:00' },
  { id: 'ped-104', cliente: 'Carlos Eduardo Lima', customer: 'Carlos Eduardo Lima', total: 210.50, status: 'em_preparo', itens: 9, items: 9, pagamento: 'Cartão', payment: 'Cartão', data: '2026-09-29T14:15:00', date: '2026-09-29T14:15:00' },
  { id: 'ped-105', cliente: 'Mercado Central LTDA', customer: 'Mercado Central LTDA', total: 423.90, status: 'finalizado', itens: 18, items: 18, pagamento: 'PIX', payment: 'PIX', data: '2026-09-29T13:50:00', date: '2026-09-29T13:50:00' },
  { id: 'ped-106', cliente: 'Loja do Bairro ME', customer: 'Loja do Bairro ME', total: 340.75, status: 'finalizado', itens: 14, items: 14, pagamento: 'Cartão', payment: 'Cartão', data: '2026-09-29T13:30:00', date: '2026-09-29T13:30:00' },
];

export const vendasRecentes = [
  { id: 'v1024', cliente: 'Ana Beatriz Souza', customer: 'Ana Beatriz Souza', total: 87.40, status: 'Concluída', itens: 5, items: 5, data: '2026-09-29T14:32:00', date: '2026-09-29T14:32:00' },
  { id: 'v1023', cliente: 'Mercado Central LTDA', customer: 'Mercado Central LTDA', total: 423.90, status: 'Concluída', itens: 18, items: 18, data: '2026-09-29T13:10:00', date: '2026-09-29T13:10:00' },
  { id: 'v1022', cliente: 'João Pedro Alves', customer: 'João Pedro Alves', total: 56.20, status: 'Pendente', itens: 3, items: 3, data: '2026-09-29T12:45:00', date: '2026-09-29T12:45:00' },
  { id: 'v1021', cliente: 'Fernanda Oliveira', customer: 'Fernanda Oliveira', total: 120.00, status: 'Cancelada', itens: 7, items: 7, data: '2026-09-29T11:20:00', date: '2026-09-29T11:20:00' },
  { id: 'v1020', cliente: 'Carlos Eduardo Lima', customer: 'Carlos Eduardo Lima', total: 210.50, status: 'Concluída', itens: 9, items: 9, data: '2026-09-29T10:05:00', date: '2026-09-29T10:05:00' },
  { id: 'v1019', cliente: 'Loja do Bairro ME', customer: 'Loja do Bairro ME', total: 340.75, status: 'Concluída', itens: 14, items: 14, data: '2026-09-29T09:15:00', date: '2026-09-29T09:15:00' },
];

export const vendasPorDia = [
  { dia: '22/09', day: '22/09', vendas: 1240 },
  { dia: '23/09', day: '23/09', vendas: 980 },
  { dia: '24/09', day: '24/09', vendas: 1560 },
  { dia: '25/09', day: '25/09', vendas: 1320 },
  { dia: '26/09', day: '26/09', vendas: 2100 },
  { dia: '27/09', day: '27/09', vendas: 2890 },
  { dia: '28/09', day: '28/09', vendas: 2450 },
  { dia: '29/09', day: '29/09', vendas: 1870 },
];

export const vendasPorCategoria = [
  { nome: 'Bebidas', name: 'Bebidas', valor: 3420, value: 3420 },
  { nome: 'Alimentos', name: 'Alimentos', valor: 2890, value: 2890 },
  { nome: 'Limpeza', name: 'Limpeza', valor: 1240, value: 1240 },
  { nome: 'Higiene', name: 'Higiene', valor: 980, value: 980 },
  { nome: 'Padaria', name: 'Padaria', valor: 760, value: 760 },
];

export const transacoes = [
  { id: 't1', descricao: 'Venda PDV #1024', description: 'Venda PDV #1024', tipo: 'entrada', type: 'entrada', valor: 87.40, amount: 87.40, data: '2026-09-29', date: '2026-09-29', categoria: 'Vendas', category: 'Vendas' },
  { id: 't2', descricao: 'Pagamento fornecedor', description: 'Pagamento fornecedor', tipo: 'saida', type: 'saida', valor: 1200.00, amount: 1200.00, data: '2026-09-28', date: '2026-09-28', categoria: 'Fornecedores', category: 'Fornecedores' },
  { id: 't3', descricao: 'Venda PDV #1020', description: 'Venda PDV #1020', tipo: 'entrada', type: 'entrada', valor: 210.50, amount: 210.50, data: '2026-09-29', date: '2026-09-29', categoria: 'Vendas', category: 'Vendas' },
  { id: 't4', descricao: 'Aluguel loja', description: 'Aluguel loja', tipo: 'saida', type: 'saida', valor: 2500.00, amount: 2500.00, data: '2026-09-25', date: '2026-09-25', categoria: 'Fixos', category: 'Fixos' },
  { id: 't5', descricao: 'Venda PDV #1019', description: 'Venda PDV #1019', tipo: 'entrada', type: 'entrada', valor: 340.75, amount: 340.75, data: '2026-09-29', date: '2026-09-29', categoria: 'Vendas', category: 'Vendas' },
  { id: 't6', descricao: 'Conta de energia', description: 'Conta de energia', tipo: 'saida', type: 'saida', valor: 480.30, amount: 480.30, data: '2026-09-24', date: '2026-09-24', categoria: 'Fixos', category: 'Fixos' },
  { id: 't7', descricao: 'Venda PDV #1015', description: 'Venda PDV #1015', tipo: 'entrada', type: 'entrada', valor: 156.90, amount: 156.90, data: '2026-09-28', date: '2026-09-28', categoria: 'Vendas', category: 'Vendas' },
  { id: 't8', descricao: 'Salário funcionário', description: 'Salário funcionário', tipo: 'saida', type: 'saida', valor: 1800.00, amount: 1800.00, data: '2026-09-22', date: '2026-09-22', categoria: 'Pessoal', category: 'Pessoal' },
];

export const financeiroMensal = [
  { mes: 'Abr', month: 'Abr', receitas: 12400, despesas: 8200 },
  { mes: 'Mai', month: 'Mai', receitas: 13900, despesas: 7800 },
  { mes: 'Jun', month: 'Jun', receitas: 15200, despesas: 9100 },
  { mes: 'Jul', month: 'Jul', receitas: 14600, despesas: 8600 },
  { mes: 'Ago', month: 'Ago', receitas: 16800, despesas: 9400 },
  { mes: 'Set', month: 'Set', receitas: 18300, despesas: 10100 },
];

export const produtosMaisVendidos = [
  { nome: 'Arroz Branco 5kg', name: 'Arroz Branco 5kg', vendas: 142, receita: 3961.80 },
  { nome: 'Refrigerante Cola 2L', name: 'Refrigerante Cola 2L', vendas: 128, receita: 1150.72 },
  { nome: 'Feijão Carioca 1kg', name: 'Feijão Carioca 1kg', vendas: 96, receita: 959.04 },
  { nome: 'Pão Francês kg', name: 'Pão Francês kg', vendas: 84, receita: 1083.60 },
  { nome: 'Sabão em Pó 1kg', name: 'Sabão em Pó 1kg', vendas: 67, receita: 998.30 },
];

export const melhoresClientes = [
  { nome: 'Mercado Central LTDA', name: 'Mercado Central LTDA', total: 12450.00, compras: 38 },
  { nome: 'Loja do Bairro ME', name: 'Loja do Bairro ME', total: 8900.40, compras: 27 },
  { nome: 'João Pedro Alves', name: 'João Pedro Alves', total: 3210.75, compras: 14 },
  { nome: 'Ana Beatriz Souza', name: 'Ana Beatriz Souza', total: 2340.90, compras: 11 },
  { nome: 'Carlos Eduardo Lima', name: 'Carlos Eduardo Lima', total: 1890.50, compras: 9 },
];

// Aliases para retrocompatibilidade
export const categories = categorias;
export const products = produtos;
export const customers = clientes;
export const orders = pedidos;
export const recentSales = vendasRecentes;
export const salesByDay = vendasPorDia;
export const salesByCategory = vendasPorCategoria;
export const transactions = transacoes;
export const monthlyFinance = financeiroMensal;
export const topProducts = produtosMaisVendidos;
export const topCustomers = melhoresClientes;
