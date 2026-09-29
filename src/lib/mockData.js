export const categories = [
  { id: 'bebidas', name: 'Bebidas', color: '#339989' },
  { id: 'alimentos', name: 'Alimentos', color: '#7DE2D1' },
  { id: 'limpeza', name: 'Limpeza', color: '#2A7A6E' },
  { id: 'higiene', name: 'Higiene', color: '#5CBBB0' },
  { id: 'padaria', name: 'Padaria', color: '#9AE8DB' },
];

export const products = [
  { id: 'p1', name: 'Refrigerante Cola 2L', sku: 'BEB001', category: 'bebidas', cost: 4.50, price: 8.99, stock: 42, minStock: 12, barcode: '7891234560011' },
  { id: 'p2', name: 'Suco de Laranja 1L', sku: 'BEB002', category: 'bebidas', cost: 5.00, price: 11.50, stock: 8, minStock: 10, barcode: '7891234560028' },
  { id: 'p3', name: 'Água Mineral 500ml', sku: 'BEB003', category: 'bebidas', cost: 1.20, price: 3.49, stock: 120, minStock: 24, barcode: '7891234560035' },
  { id: 'p4', name: 'Arroz Branco 5kg', sku: 'ALI001', category: 'alimentos', cost: 18.00, price: 27.90, stock: 35, minStock: 8, barcode: '7891234560042' },
  { id: 'p5', name: 'Feijão Carioca 1kg', sku: 'ALI002', category: 'alimentos', cost: 6.50, price: 9.99, stock: 4, minStock: 10, barcode: '7891234560059' },
  { id: 'p6', name: 'Macarrão Espaguete 500g', sku: 'ALI003', category: 'alimentos', cost: 3.20, price: 6.49, stock: 60, minStock: 20, barcode: '7891234560066' },
  { id: 'p7', name: 'Detergente Líquido 500ml', sku: 'LIM001', category: 'limpeza', cost: 1.80, price: 4.29, stock: 0, minStock: 15, barcode: '7891234560073' },
  { id: 'p8', name: 'Sabão em Pó 1kg', sku: 'LIM002', category: 'limpeza', cost: 8.00, price: 14.90, stock: 22, minStock: 6, barcode: '7891234560080' },
  { id: 'p9', name: 'Shampoo Hidratante 350ml', sku: 'HIG001', category: 'higiene', cost: 7.50, price: 15.90, stock: 18, minStock: 8, barcode: '7891234560097' },
  { id: 'p10', name: 'Creme Dental 90g', sku: 'HIG002', category: 'higiene', cost: 2.00, price: 5.49, stock: 50, minStock: 12, barcode: '7891234560103' },
  { id: 'p11', name: 'Pão Francês kg', sku: 'PAD001', category: 'padaria', cost: 6.00, price: 12.90, stock: 30, minStock: 10, barcode: '7891234560110' },
  { id: 'p12', name: 'Bolo de Chocolate fatia', sku: 'PAD002', category: 'padaria', cost: 3.50, price: 8.50, stock: 6, minStock: 8, barcode: '7891234560127' },
];

export const customers = [
  { id: 'c1', name: 'Ana Beatriz Souza', doc: '123.456.789-00', phone: '(11) 98765-4321', totalPurchases: 2340.90, email: 'ana.souza@email.com' },
  { id: 'c2', name: 'Carlos Eduardo Lima', doc: '987.654.321-99', phone: '(11) 91234-5678', totalPurchases: 1890.50, email: 'carlos.lima@email.com' },
  { id: 'c3', name: 'Mercado Central LTDA', doc: '12.345.678/0001-90', phone: '(11) 3333-4444', totalPurchases: 12450.00, email: 'contato@mercadocentral.com' },
  { id: 'c4', name: 'Fernanda Oliveira', doc: '456.789.123-44', phone: '(21) 99876-5432', totalPurchases: 760.00, email: 'fernanda.o@email.com' },
  { id: 'c5', name: 'João Pedro Alves', doc: '321.654.987-22', phone: '(31) 98123-4567', totalPurchases: 3210.75, email: 'joao.alves@email.com' },
  { id: 'c6', name: 'Loja do Bairro ME', doc: '98.765.432/0001-10', phone: '(11) 2222-3333', totalPurchases: 8900.40, email: 'vendas@lojadobairro.com' },
  { id: 'c7', name: 'Mariana Costa Ribeiro', doc: '654.321.987-55', phone: '(41) 99988-7766', totalPurchases: 540.20, email: 'mariana.r@email.com' },
  { id: 'c8', name: 'Rafael Mendes', doc: '789.123.456-77', phone: '(51) 98765-1234', totalPurchases: 1670.30, email: 'rafael.m@email.com' },
];

export const recentSales = [
  { id: 'v1024', customer: 'Ana Beatriz Souza', total: 87.40, status: 'Concluída', items: 5, date: '2026-09-29T14:32:00' },
  { id: 'v1023', customer: 'Mercado Central LTDA', total: 423.90, status: 'Concluída', items: 18, date: '2026-09-29T13:10:00' },
  { id: 'v1022', customer: 'João Pedro Alves', total: 56.20, status: 'Pendente', items: 3, date: '2026-09-29T12:45:00' },
  { id: 'v1021', customer: 'Fernanda Oliveira', total: 120.00, status: 'Cancelada', items: 7, date: '2026-09-29T11:20:00' },
  { id: 'v1020', customer: 'Carlos Eduardo Lima', total: 210.50, status: 'Concluída', items: 9, date: '2026-09-29T10:05:00' },
  { id: 'v1019', customer: 'Loja do Bairro ME', total: 340.75, status: 'Concluída', items: 14, date: '2026-09-29T09:15:00' },
];

export const salesByDay = [
  { day: '22/09', vendas: 1240 },
  { day: '23/09', vendas: 980 },
  { day: '24/09', vendas: 1560 },
  { day: '25/09', vendas: 1320 },
  { day: '26/09', vendas: 2100 },
  { day: '27/09', vendas: 2890 },
  { day: '28/09', vendas: 2450 },
  { day: '29/09', vendas: 1870 },
];

export const salesByCategory = [
  { name: 'Bebidas', value: 3420 },
  { name: 'Alimentos', value: 2890 },
  { name: 'Limpeza', value: 1240 },
  { name: 'Higiene', value: 980 },
  { name: 'Padaria', value: 760 },
];

export const transactions = [
  { id: 't1', description: 'Venda PDV #1024', type: 'entrada', amount: 87.40, date: '2026-09-29', category: 'Vendas' },
  { id: 't2', description: 'Pagamento fornecedor', type: 'saida', amount: 1200.00, date: '2026-09-28', category: 'Fornecedores' },
  { id: 't3', description: 'Venda PDV #1020', type: 'entrada', amount: 210.50, date: '2026-09-29', category: 'Vendas' },
  { id: 't4', description: 'Aluguel loja', type: 'saida', amount: 2500.00, date: '2026-09-25', category: 'Fixos' },
  { id: 't5', description: 'Venda PDV #1019', type: 'entrada', amount: 340.75, date: '2026-09-29', category: 'Vendas' },
  { id: 't6', description: 'Conta de energia', type: 'saida', amount: 480.30, date: '2026-09-24', category: 'Fixos' },
  { id: 't7', description: 'Venda PDV #1015', type: 'entrada', amount: 156.90, date: '2026-09-28', category: 'Vendas' },
  { id: 't8', description: 'Salário funcionário', type: 'saida', amount: 1800.00, date: '2026-09-22', category: 'Pessoal' },
];

export const monthlyFinance = [
  { month: 'Abr', receitas: 12400, despesas: 8200 },
  { month: 'Mai', receitas: 13900, despesas: 7800 },
  { month: 'Jun', receitas: 15200, despesas: 9100 },
  { month: 'Jul', receitas: 14600, despesas: 8600 },
  { month: 'Ago', receitas: 16800, despesas: 9400 },
  { month: 'Set', receitas: 18300, despesas: 10100 },
];

export const topProducts = [
  { name: 'Arroz Branco 5kg', vendas: 142, receita: 3961.80 },
  { name: 'Refrigerante Cola 2L', vendas: 128, receita: 1150.72 },
  { name: 'Feijão Carioca 1kg', vendas: 96, receita: 959.04 },
  { name: 'Pão Francês kg', vendas: 84, receita: 1083.60 },
  { name: 'Sabão em Pó 1kg', vendas: 67, receita: 998.30 },
];

export const topCustomers = [
  { name: 'Mercado Central LTDA', total: 12450.00, compras: 38 },
  { name: 'Loja do Bairro ME', total: 8900.40, compras: 27 },
  { name: 'João Pedro Alves', total: 3210.75, compras: 14 },
  { name: 'Ana Beatriz Souza', total: 2340.90, compras: 11 },
  { name: 'Carlos Eduardo Lima', total: 1890.50, compras: 9 },
];

export const orders = [
  { id: 'ped-101', customer: 'João Pedro Alves', total: 56.20, status: 'pendente', items: 3, payment: 'PIX', date: '2026-09-29T14:40:00' },
  { id: 'ped-102', customer: 'Fernanda Oliveira', total: 120.00, status: 'pendente', items: 7, payment: 'Cartão', date: '2026-09-29T14:35:00' },
  { id: 'ped-103', customer: 'Ana Beatriz Souza', total: 87.40, status: 'em_preparo', items: 5, payment: 'Dinheiro', date: '2026-09-29T14:20:00' },
  { id: 'ped-104', customer: 'Carlos Eduardo Lima', total: 210.50, status: 'em_preparo', items: 9, payment: 'Cartão', date: '2026-09-29T14:15:00' },
  { id: 'ped-105', customer: 'Mercado Central LTDA', total: 423.90, status: 'finalizado', items: 18, payment: 'PIX', date: '2026-09-29T13:50:00' },
  { id: 'ped-106', customer: 'Loja do Bairro ME', total: 340.75, status: 'finalizado', items: 14, payment: 'Cartão', date: '2026-09-29T13:30:00' },
];

