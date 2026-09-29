# 📑 Contrato de API — Nexora ERP & PDV (Front-end ➔ Back-end)

Este documento especifica todos os endpoints REST, formatos de dados (JSON) esperados no envio (`Request Body`) e os retornos esperados (`Response Body`) pelo Front-end.

---

## 📑 Índice dos Módulos

1. [Autenticação](#1-autenticação-apiauth)
2. [Produtos & Categorias](#2-produtos--categorias-apiprodutos-e-apicategorias)
3. [Estoque](#3-estoque-apiestoque)
4. [Clientes](#4-clientes-apiclientes)
5. [PDV & Vendas](#5-pdv--vendas-apivendas)
6. [Kanban de Pedidos](#6-kanban-de-pedidos-apipedidos)
7. [Financeiro](#7-financeiro-apifinanceiro)
8. [Dashboard & Relatórios](#8-dashboard--relatórios-apidashboard-e-apirelatorios)
9. [Configurações](#9-configurações-apiconfiguracoes)

---

## 1. Autenticação (`/api/auth`)

### 1.1 Cadastro de Usuário
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
```json
{
  "email": "usuario@empresa.com",
  "password": "SenhaSegura123!"
}
```
- **Response Body (`201 Created`)**:
```json
{
  "sucesso": true,
  "mensagem": "Código de verificação enviado para o e-mail informado.",
  "email": "usuario@empresa.com"
}
```

---

### 1.2 Verificação de OTP (Código de E-mail)
- **Endpoint**: `POST /api/auth/verify-otp`
- **Request Body**:
```json
{
  "email": "usuario@empresa.com",
  "otpCode": "123456"
}
```
- **Response Body (`200 OK`)**:
```json
{
  "access_token": "jwt_token_aqui...",
  "user": {
    "id": "usr_01",
    "email": "usuario@empresa.com",
    "nome": "Usuário Admin",
    "role": "admin"
  }
}
```

---

### 1.3 Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
```json
{
  "email": "usuario@empresa.com",
  "password": "SenhaSegura123!"
}
```
- **Response Body (`200 OK`)**:
```json
{
  "access_token": "jwt_token_aqui...",
  "user": {
    "id": "usr_01",
    "email": "usuario@empresa.com",
    "nome": "Usuário Admin",
    "role": "admin"
  }
}
```

---

### 1.4 Usuário Autenticado Atual
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response Body (`200 OK`)**:
```json
{
  "id": "usr_01",
  "email": "usuario@empresa.com",
  "nome": "Usuário Admin",
  "role": "admin"
}
```

---

## 2. Produtos & Categorias (`/api/produtos` e `/api/categorias`)

### 2.1 Listar Categorias
- **Endpoint**: `GET /api/categorias`
- **Response Body (`200 OK`)**:
```json
[
  { "id": "bebidas", "nome": "Bebidas", "cor": "#339989" },
  { "id": "alimentos", "nome": "Alimentos", "cor": "#7DE2D1" },
  { "id": "limpeza", "nome": "Limpeza", "cor": "#2A7A6E" },
  { "id": "higiene", "nome": "Higiene", "cor": "#5CBBB0" },
  { "id": "padaria", "nome": "Padaria", "cor": "#9AE8DB" }
]
```

---

### 2.2 Listar Produtos
- **Endpoint**: `GET /api/produtos`
- **Query Params opcionais**: `?categoria=bebidas&busca=cola`
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "p1",
    "nome": "Refrigerante Cola 2L",
    "sku": "BEB001",
    "categoria": "bebidas",
    "custo": 4.50,
    "preco": 8.99,
    "estoque": 42,
    "estoqueMinimo": 12,
    "codigoBarras": "7891234560011"
  },
  {
    "id": "p2",
    "nome": "Suco de Laranja 1L",
    "sku": "BEB002",
    "categoria": "bebidas",
    "custo": 5.00,
    "preco": 11.50,
    "estoque": 8,
    "estoqueMinimo": 10,
    "codigoBarras": "7891234560028"
  }
]
```

---

### 2.3 Criar Produto
- **Endpoint**: `POST /api/produtos`
- **Request Body**:
```json
{
  "nome": "Água com Gás 500ml",
  "sku": "BEB004",
  "categoria": "bebidas",
  "custo": 1.50,
  "preco": 4.00,
  "estoque": 50,
  "estoqueMinimo": 10,
  "codigoBarras": "7891234560049"
}
```
- **Response Body (`201 Created`)**:
```json
{
  "id": "p13",
  "nome": "Água com Gás 500ml",
  "sku": "BEB004",
  "categoria": "bebidas",
  "custo": 1.50,
  "preco": 4.00,
  "estoque": 50,
  "estoqueMinimo": 10,
  "codigoBarras": "7891234560049"
}
```

---

### 2.4 Atualizar Produto
- **Endpoint**: `PUT /api/produtos/:id`
- **Request Body**:
```json
{
  "nome": "Água com Gás 500ml",
  "sku": "BEB004",
  "categoria": "bebidas",
  "custo": 1.60,
  "preco": 4.50,
  "estoque": 65,
  "estoqueMinimo": 15,
  "codigoBarras": "7891234560049"
}
```
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true,
  "mensagem": "Produto atualizado com sucesso"
}
```

---

### 2.5 Excluir Produto
- **Endpoint**: `DELETE /api/produtos/:id`
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true,
  "mensagem": "Produto removido com sucesso"
}
```

---

## 3. Estoque (`/api/estoque`)

### 3.1 Consulta de Níveis de Estoque
- **Endpoint**: `GET /api/estoque`
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "p1",
    "nome": "Refrigerante Cola 2L",
    "sku": "BEB001",
    "categoria": "bebidas",
    "estoque": 42,
    "estoqueMinimo": 12,
    "status": "OK"
  },
  {
    "id": "p7",
    "nome": "Detergente Líquido 500ml",
    "sku": "LIM001",
    "categoria": "limpeza",
    "estoque": 0,
    "estoqueMinimo": 15,
    "status": "Sem Estoque"
  }
]
```

---

## 4. Clientes (`/api/clientes`)

### 4.1 Listar Clientes
- **Endpoint**: `GET /api/clientes`
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "c1",
    "nome": "Ana Beatriz Souza",
    "documento": "123.456.789-00",
    "telefone": "(11) 98765-4321",
    "email": "ana.souza@email.com",
    "totalCompras": 2340.90
  },
  {
    "id": "c3",
    "nome": "Mercado Central LTDA",
    "documento": "12.345.678/0001-90",
    "telefone": "(11) 3333-4444",
    "email": "contato@mercadocentral.com",
    "totalCompras": 12450.00
  }
]
```

---

### 4.2 Cadastrar Cliente
- **Endpoint**: `POST /api/clientes`
- **Request Body**:
```json
{
  "nome": "Lucas Martins",
  "documento": "333.444.555-66",
  "telefone": "(11) 97777-8888",
  "email": "lucas@email.com"
}
```
- **Response Body (`201 Created`)**:
```json
{
  "id": "c9",
  "nome": "Lucas Martins",
  "documento": "333.444.555-66",
  "telefone": "(11) 97777-8888",
  "email": "lucas@email.com",
  "totalCompras": 0.00
}
```

---

### 4.3 Atualizar Cliente
- **Endpoint**: `PUT /api/clientes/:id`
- **Request Body**:
```json
{
  "nome": "Lucas Martins da Silva",
  "documento": "333.444.555-66",
  "telefone": "(11) 97777-8888",
  "email": "lucas.silva@email.com"
}
```
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true,
  "mensagem": "Cliente atualizado com sucesso"
}
```

---

### 4.4 Excluir Cliente
- **Endpoint**: `DELETE /api/clientes/:id`
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true,
  "mensagem": "Cliente removido com sucesso"
}
```

---

## 5. PDV & Vendas (`/api/vendas`)

### 5.1 Finalizar Venda (Checkout PDV)
- **Endpoint**: `POST /api/vendas`
- **Request Body**:
```json
{
  "clienteId": "c1",
  "formaPagamento": "pix",
  "subtotal": 56.88,
  "desconto": 0.00,
  "total": 56.88,
  "valorRecebido": 56.88,
  "troco": 0.00,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Refrigerante Cola 2L",
      "quantidade": 2,
      "precoUnitario": 8.99,
      "totalItem": 17.98
    },
    {
      "produtoId": "p4",
      "nome": "Arroz Branco 5kg",
      "quantidade": 1,
      "precoUnitario": 27.90,
      "totalItem": 27.90
    },
    {
      "produtoId": "p11",
      "nome": "Pão Francês kg",
      "quantidade": 0.85,
      "precoUnitario": 12.90,
      "totalItem": 10.97
    }
  ]
}
```
- **Response Body (`201 Created`)**:
```json
{
  "id": "v1025",
  "status": "Concluída",
  "total": 56.88,
  "data": "2026-09-29T15:35:00",
  "mensagem": "Venda finalizada com sucesso."
}
```

---

## 6. Kanban de Pedidos (`/api/pedidos`)

### 6.1 Listar Pedidos do Kanban
- **Endpoint**: `GET /api/pedidos`
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "ped-101",
    "cliente": "João Pedro Alves",
    "total": 56.20,
    "status": "pendente",
    "itens": 3,
    "pagamento": "PIX",
    "data": "2026-09-29T14:40:00"
  },
  {
    "id": "ped-103",
    "cliente": "Ana Beatriz Souza",
    "total": 87.40,
    "status": "em_preparo",
    "itens": 5,
    "pagamento": "Dinheiro",
    "data": "2026-09-29T14:20:00"
  },
  {
    "id": "ped-105",
    "cliente": "Mercado Central LTDA",
    "total": 423.90,
    "status": "finalizado",
    "itens": 18,
    "pagamento": "PIX",
    "data": "2026-09-29T13:50:00"
  }
]
```

---

### 6.2 Atualizar Status do Pedido (Arrastar Card no Kanban)
- **Endpoint**: `PATCH /api/pedidos/:id/status`
- **Request Body**:
```json
{
  "status": "em_preparo"
}
```
*(Valores válidos para status: `"pendente"`, `"em_preparo"`, `"finalizado"`)*
- **Response Body (`200 OK`)**:
```json
{
  "id": "ped-101",
  "status": "em_preparo",
  "mensagem": "Status do pedido atualizado com sucesso"
}
```

---

## 7. Financeiro (`/api/financeiro`)

### 7.1 Listar Movimentações / Transações
- **Endpoint**: `GET /api/financeiro/transacoes`
- **Query Params opcionais**: `?tipo=entrada` ou `?tipo=saida`
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "t1",
    "descricao": "Venda PDV #1024",
    "tipo": "entrada",
    "valor": 87.40,
    "data": "2026-09-29",
    "categoria": "Vendas"
  },
  {
    "id": "t2",
    "descricao": "Pagamento fornecedor",
    "tipo": "saida",
    "valor": 1200.00,
    "data": "2026-09-28",
    "categoria": "Fornecedores"
  },
  {
    "id": "t4",
    "descricao": "Aluguel loja",
    "tipo": "saida",
    "valor": 2500.00,
    "data": "2026-09-25",
    "categoria": "Fixos"
  }
]
```

---

### 7.2 Cadastrar Nova Movimentação
- **Endpoint**: `POST /api/financeiro/transacoes`
- **Request Body**:
```json
{
  "descricao": "Conta de Internet Fibra",
  "tipo": "saida",
  "valor": 149.90,
  "categoria": "Fixos",
  "data": "2026-09-29"
}
```
- **Response Body (`201 Created`)**:
```json
{
  "id": "t9",
  "descricao": "Conta de Internet Fibra",
  "tipo": "saida",
  "valor": 149.90,
  "categoria": "Fixos",
  "data": "2026-09-29"
}
```

---

### 7.3 Balanço Financeiro Mensal (Gráfico Receitas x Despesas)
- **Endpoint**: `GET /api/financeiro/mensal`
- **Response Body (`200 OK`)**:
```json
[
  { "mes": "Abr", "receitas": 12400, "despesas": 8200 },
  { "mes": "Mai", "receitas": 13900, "despesas": 7800 },
  { "mes": "Jun", "receitas": 15200, "despesas": 9100 },
  { "mes": "Jul", "receitas": 14600, "despesas": 8600 },
  { "mes": "Ago", "receitas": 16800, "despesas": 9400 },
  { "mes": "Set", "receitas": 18300, "despesas": 10100 }
]
```

---

## 8. Dashboard & Relatórios (`/api/dashboard` e `/api/relatorios`)

### 8.1 KPIs do Dashboard
- **Endpoint**: `GET /api/dashboard/kpis`
- **Response Body (`200 OK`)**:
```json
{
  "vendasHoje": 1870.00,
  "ticketMedio": 62.30,
  "produtosEmBaixa": 4,
  "faturamentoMensal": 18300.00
}
```

---

### 8.2 Vendas por Dia (Gráfico de Área)
- **Endpoint**: `GET /api/relatorios/vendas-por-dia`
- **Query Params**: `?dataInicio=2026-09-01&dataFim=2026-09-29`
- **Response Body (`200 OK`)**:
```json
[
  { "dia": "22/09", "vendas": 1240 },
  { "dia": "23/09", "vendas": 980 },
  { "dia": "24/09", "vendas": 1560 },
  { "dia": "25/09", "vendas": 1320 },
  { "dia": "26/09", "vendas": 2100 },
  { "dia": "27/09", "vendas": 2890 },
  { "dia": "28/09", "vendas": 2450 },
  { "dia": "29/09", "vendas": 1870 }
]
```

---

### 8.3 Vendas por Categoria (Gráfico Donut/Pizza)
- **Endpoint**: `GET /api/relatorios/vendas-por-categoria`
- **Response Body (`200 OK`)**:
```json
[
  { "nome": "Bebidas", "valor": 3420 },
  { "nome": "Alimentos", "valor": 2890 },
  { "nome": "Limpeza", "valor": 1240 },
  { "nome": "Higiene", "valor": 980 },
  { "nome": "Padaria", "valor": 760 }
]
```

---

### 8.4 Top Produtos Mais Vendidos
- **Endpoint**: `GET /api/relatorios/produtos-mais-vendidos`
- **Response Body (`200 OK`)**:
```json
[
  { "nome": "Arroz Branco 5kg", "vendas": 142, "receita": 3961.80 },
  { "nome": "Refrigerante Cola 2L", "vendas": 128, "receita": 1150.72 },
  { "nome": "Feijão Carioca 1kg", "vendas": 96, "receita": 959.04 },
  { "nome": "Pão Francês kg", "vendas": 84, "receita": 1083.60 },
  { "nome": "Sabão em Pó 1kg", "vendas": 67, "receita": 998.30 }
]
```

---

### 8.5 Melhores Clientes
- **Endpoint**: `GET /api/relatorios/melhores-clientes`
- **Response Body (`200 OK`)**:
```json
[
  { "nome": "Mercado Central LTDA", "total": 12450.00, "compras": 38 },
  { "nome": "Loja do Bairro ME", "total": 8900.40, "compras": 27 },
  { "nome": "João Pedro Alves", "total": 3210.75, "compras": 14 },
  { "nome": "Ana Beatriz Souza", "total": 2340.90, "compras": 11 },
  { "nome": "Carlos Eduardo Lima", "total": 1890.50, "compras": 9 }
]
```

---

### 8.6 Últimas Vendas do Dashboard
- **Endpoint**: `GET /api/vendas/recentes`
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "v1024",
    "cliente": "Ana Beatriz Souza",
    "total": 87.40,
    "status": "Concluída",
    "itens": 5,
    "data": "2026-09-29T14:32:00"
  },
  {
    "id": "v1023",
    "cliente": "Mercado Central LTDA",
    "total": 423.90,
    "status": "Concluída",
    "itens": 18,
    "data": "2026-09-29T13:10:00"
  },
  {
    "id": "v1022",
    "cliente": "João Pedro Alves",
    "total": 56.20,
    "status": "Pendente",
    "itens": 3,
    "data": "2026-09-29T12:45:00"
  }
]
```

---

## 9. Configurações (`/api/configuracoes`)

### 9.1 Obter Configurações
- **Endpoint**: `GET /api/configuracoes`
- **Response Body (`200 OK`)**:
```json
{
  "loja": {
    "nome": "Nexora Market",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 3333-4444"
  },
  "notificacoes": {
    "push": true,
    "alertaEstoqueBaixo": true
  },
  "impressao": {
    "automatica": false,
    "modelo": "Térmica 80mm"
  },
  "seguranca": {
    "doisFatores": false
  }
}
```

---

### 9.2 Atualizar Configurações
- **Endpoint**: `PUT /api/configuracoes`
- **Request Body**:
```json
{
  "loja": {
    "nome": "Nexora Market Matriz",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 3333-5555"
  },
  "notificacoes": {
    "push": true,
    "alertaEstoqueBaixo": true
  },
  "impressao": {
    "automatica": true,
    "modelo": "Térmica 80mm"
  },
  "seguranca": {
    "doisFatores": true
  }
}
```
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true,
  "mensagem": "Configurações salvas com sucesso"
}
```
