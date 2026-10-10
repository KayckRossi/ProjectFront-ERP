# 📑 Contrato de API — Nexora ERP & PDV (Front-end ➔ Back-end)

Este documento especifica todos os endpoints REST, formatos de dados (JSON) esperados no envio (`Request Body`) e os retornos esperados (`Response Body`) pelo Front-end.

> **Situação atual do front-end:** a autenticação (seção 1) já consome a API quando `VITE_API_URL` está definida. Os demais módulos ainda usam dados locais (`src/lib/ErpDataContext.jsx`), com as mesmas regras descritas aqui, e serão ligados a estes endpoints. Os campos e regras abaixo refletem o que as telas já enviam e exibem.

---

## 📑 Índice dos Módulos

0. [Convenções Gerais](#0-convenções-gerais)
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

## 0. Convenções Gerais

- **Base URL**: definida no front pela variável `VITE_API_URL` (ex.: `http://localhost:3000`). Todas as rotas começam com `/api`.
- **Formato**: `Content-Type: application/json` no envio e no retorno; campos em português e `camelCase`.
- **Autenticação**: todas as rotas, exceto as marcadas como públicas na seção 1, exigem `Authorization: Bearer <access_token>`. Sem token ou com token inválido/expirado → `401`.
- **CORS**: se a API estiver em outro domínio, liberar a origem do front e os headers `Content-Type` e `Authorization`.
- **IDs**: sempre `string` (ex.: `"p1"`, `"c3"`, `"v1025"`, `"ped-107"`, `"t9"`).
- **Valores monetários**: `number` em reais com até 2 casas decimais (ex.: `35.96`). Nunca strings formatadas.
- **Datas**:
  - Data com horário: ISO 8601 com fuso (ex.: `"2026-10-10T14:32:00-03:00"` ou `"2026-10-10T17:32:00Z"`).
  - Data sem horário: `"AAAA-MM-DD"` (ex.: `"2026-09-29"`). O front exibe como data local, sem conversão de fuso.
- **Listas**: retornam um array JSON diretamente (sem envelope).
- **Criação/atualização**: `POST` e `PUT` retornam o **registro completo** salvo, para o front substituir o item na tela sem recarregar a lista.
- **Erros**: status HTTP adequado e um corpo com a mensagem que o front exibe ao usuário:

| Status | Quando usar |
|---|---|
| `400` | Dados inválidos (campo obrigatório ausente, valor fora da regra) |
| `401` | Não autenticado, token inválido ou credenciais incorretas no login |
| `403` | Autenticado, mas sem permissão |
| `404` | Registro não encontrado |
| `409` | Conflito (e-mail/SKU/documento duplicado, estoque insuficiente) |
| `500` | Erro inesperado |

```json
{
  "mensagem": "Estoque insuficiente para Feijão Carioca 1kg (disponível: 4)."
}
```

---

## 1. Autenticação (`/api/auth`)

> ✅ **Já consumido pelo front-end.** O token é salvo no navegador e enviado como `Bearer` em todas as requisições. Ao receber `401` em `GET /api/auth/me`, o front descarta o token e volta para a tela de login.
> Login com Google existe apenas no modo demonstração; não há endpoint de OAuth neste contrato.

### 1.1 Cadastro de Usuário (pública)
- **Endpoint**: `POST /api/auth/register`
- **Regras**: `password` com no mínimo 6 caracteres; e-mail já cadastrado → `409`.
- **Request Body**:
```json
{
  "email": "usuario@empresa.com",
  "password": "SenhaSegura123!"
}
```
- **Response Body (`201 Created`)**: envia um código de 6 dígitos para o e-mail. O front então mostra a tela de verificação (1.2).
```json
{
  "sucesso": true,
  "mensagem": "Código de verificação enviado para o e-mail informado.",
  "email": "usuario@empresa.com"
}
```

---

### 1.2 Verificação de OTP (pública)
- **Endpoint**: `POST /api/auth/verify-otp`
- **Request Body**:
```json
{
  "email": "usuario@empresa.com",
  "otpCode": "123456"
}
```
- **Response Body (`200 OK`)**: o usuário já sai autenticado. Código inválido ou expirado → `400`.
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

### 1.3 Reenviar Código OTP (pública)
- **Endpoint**: `POST /api/auth/resend-otp`
- **Request Body**:
```json
{
  "email": "usuario@empresa.com"
}
```
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true
}
```

---

### 1.4 Login (pública)
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
- **Erros**: e-mail ou senha incorretos → **`401`** (o front exibe "E-mail ou senha incorretos"). Qualquer outro status exibe o campo `mensagem` retornado.

---

### 1.5 Usuário Autenticado Atual
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response Body (`200 OK`)**: o campo `nome` é exibido no cabeçalho do sistema.
```json
{
  "id": "usr_01",
  "email": "usuario@empresa.com",
  "nome": "Usuário Admin",
  "role": "admin"
}
```

---

### 1.6 Solicitar Redefinição de Senha (pública)
- **Endpoint**: `POST /api/auth/forgot-password`
- **Request Body**:
```json
{
  "email": "usuario@empresa.com"
}
```
- **Response Body (`200 OK`)**: sempre `200`, mesmo se o e-mail não existir (evita descobrir contas cadastradas). O e-mail enviado deve conter um link para `<url-do-front>/redefinir-senha?token=<token>`.
```json
{
  "sucesso": true
}
```

---

### 1.7 Redefinir Senha (pública)
- **Endpoint**: `POST /api/auth/reset-password`
- **Regras**: `password` com no mínimo 6 caracteres; token inválido ou expirado → `400`.
- **Request Body**:
```json
{
  "token": "token_recebido_por_email",
  "password": "NovaSenhaSegura123!"
}
```
- **Response Body (`200 OK`)**: o front redireciona para o login.
```json
{
  "sucesso": true
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
- **Query Params opcionais**:
  - `categoria` — id da categoria (ex.: `bebidas`)
  - `busca` — procura no **nome ou SKU**, sem diferenciar maiúsculas
  - `codigoBarras` — busca exata, usada pelo leitor de código de barras do PDV (também deve aceitar o SKU)
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
- **Regras de validação** (as mesmas aplicadas no formulário; violação → `400`):
  - `nome` obrigatório (o front envia sem espaços nas pontas)
  - `preco` > 0 e `preco` ≥ `custo`
  - `estoque` e `estoqueMinimo` inteiros ≥ 0
  - `categoria` deve existir em `/api/categorias`
  - `sku` é enviado em **maiúsculas** e deve ser único → duplicado retorna `409`
  - `codigoBarras` é opcional: o formulário não tem esse campo, então o **backend deve gerar** um código quando ele não for enviado
- **Request Body**:
```json
{
  "nome": "Água com Gás 500ml",
  "sku": "BEB004",
  "categoria": "bebidas",
  "custo": 1.50,
  "preco": 4.00,
  "estoque": 50,
  "estoqueMinimo": 10
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
  "codigoBarras": "7891234560134"
}
```

---

### 2.4 Atualizar Produto
- **Endpoint**: `PUT /api/produtos/:id`
- **Regras**: as mesmas da criação. Produto inexistente → `404`.
- **Request Body**: mesmos campos da criação (`codigoBarras` ausente = manter o atual).
```json
{
  "nome": "Água com Gás 500ml",
  "sku": "BEB004",
  "categoria": "bebidas",
  "custo": 1.60,
  "preco": 4.50,
  "estoque": 65,
  "estoqueMinimo": 15
}
```
- **Response Body (`200 OK`)**: o produto completo atualizado.
```json
{
  "id": "p13",
  "nome": "Água com Gás 500ml",
  "sku": "BEB004",
  "categoria": "bebidas",
  "custo": 1.60,
  "preco": 4.50,
  "estoque": 65,
  "estoqueMinimo": 15,
  "codigoBarras": "7891234560134"
}
```

---

### 2.5 Excluir Produto
- **Endpoint**: `DELETE /api/produtos/:id`
- **Observação**: vendas antigas guardam o nome do produto (5.1), então o histórico continua legível após a exclusão.
- **Response Body (`200 OK`)**:
```json
{
  "sucesso": true,
  "mensagem": "Produto removido com sucesso"
}
```

---

## 3. Estoque (`/api/estoque`)

### Regra de status de estoque
O mesmo cálculo é usado no front (`src/lib/estoque.js`) para os filtros e o card "Produtos em Baixa":

| Status | Condição |
|---|---|
| `"Sem Estoque"` | `estoque == 0` |
| `"Crítico"` | `estoque < estoqueMinimo` |
| `"Baixo"` | `estoque < estoqueMinimo × 1,5` |
| `"OK"` | demais casos |

---

### 3.1 Consulta de Níveis de Estoque
- **Endpoint**: `GET /api/estoque`
- **Query Params opcionais**:
  - `filtro=baixo` — produtos com estoque > 0 e status `Crítico` ou `Baixo`
  - `filtro=sem-estoque` — produtos com estoque 0
  - `busca` — nome ou SKU
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

### 3.2 Movimentar Estoque (Entrada / Saída)
Botão **Movimentar** da tela de Estoque.
- **Endpoint**: `POST /api/estoque/movimentacoes`
- **Regras**:
  - `tipo`: `"entrada"` (soma) ou `"saida"` (subtrai: perda, avaria, uso interno)
  - `quantidade`: inteiro > 0
  - saída maior que o estoque atual → `409`
  - vendas do PDV **não** usam este endpoint; a baixa é feita pelo `POST /api/vendas`
- **Request Body**:
```json
{
  "produtoId": "p5",
  "tipo": "entrada",
  "quantidade": 20
}
```
- **Response Body (`201 Created`)**: o produto com o estoque atualizado.
```json
{
  "id": "p5",
  "nome": "Feijão Carioca 1kg",
  "sku": "ALI002",
  "categoria": "alimentos",
  "estoque": 24,
  "estoqueMinimo": 10,
  "status": "OK"
}
```

---

## 4. Clientes (`/api/clientes`)

### 4.1 Listar Clientes
- **Endpoint**: `GET /api/clientes`
- **Query Params opcionais**: `busca` — procura no nome, e-mail ou documento (no documento, comparar **apenas os dígitos**: `12345678900` deve encontrar `123.456.789-00`).
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
- **Regras de validação** (violação → `400`):
  - `nome` obrigatório
  - `documento` opcional; quando enviado tem 11 dígitos (CPF) ou 14 (CNPJ). O front envia **com máscara** (`123.456.789-00` / `12.345.678/0001-90`). Documento já cadastrado → `409`
  - `telefone` opcional, enviado com máscara (`(11) 3333-4444` ou `(11) 97777-8888`)
  - `email` opcional; quando enviado deve ser válido
  - `totalCompras` **não** é enviado: começa em `0` e é atualizado pelas vendas (5.1)
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
- **Regras**: as mesmas do cadastro. `totalCompras` não é alterado por esta rota.
- **Request Body**:
```json
{
  "nome": "Lucas Martins da Silva",
  "documento": "333.444.555-66",
  "telefone": "(11) 97777-8888",
  "email": "lucas.silva@email.com"
}
```
- **Response Body (`200 OK`)**: o cliente completo atualizado.
```json
{
  "id": "c9",
  "nome": "Lucas Martins da Silva",
  "documento": "333.444.555-66",
  "telefone": "(11) 97777-8888",
  "email": "lucas.silva@email.com",
  "totalCompras": 0.00
}
```

---

### 4.4 Excluir Cliente
- **Endpoint**: `DELETE /api/clientes/:id`
- **Observação**: vendas e pedidos guardam o nome do cliente, então o histórico continua legível após a exclusão.
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
- **Campos**:
  - `clienteId`: id do cliente ou `null` para **"Consumidor final"**
  - `formaPagamento`: `"dinheiro"`, `"cartao"` ou `"pix"`
  - `descontoPercentual`: de `0` a `100` (o PDV oferece 5%, 10%, 15% ou valor livre)
  - `subtotal`, `desconto` (em R$), `total`: valores calculados pelo front, enviados para conferência
  - `valorRecebido` e `troco`: apenas quando `formaPagamento` = `"dinheiro"`; caso contrário `null`
  - `itens[].quantidade`: **inteiro** ≥ 1 (o PDV não vende fracionado)
- **Validações do backend**:
  - recalcular os valores com os **preços do banco**: `subtotal = Σ preco × quantidade`, `desconto = arredondar(subtotal × descontoPercentual / 100, 2)`, `total = subtotal − desconto`. Divergência → `400`
  - estoque insuficiente em qualquer item → `409`, informando o produto na `mensagem`
  - pagamento em dinheiro com `valorRecebido < total` → `400`
  - carrinho vazio → `400`
- **Efeitos (na mesma transação do banco)**:
  1. baixa `quantidade` do estoque de cada produto
  2. cria a venda com status `"Concluída"` e o próximo número sequencial
  3. cria um pedido no Kanban com status `"pendente"` (seção 6)
  4. lança uma transação de **entrada** no financeiro: descrição `"Venda PDV #<numero>"`, categoria `"Vendas"`, data do dia (seção 7)
  5. se houver `clienteId`, soma `total` ao `totalCompras` do cliente
- **Request Body**:
```json
{
  "clienteId": "c1",
  "formaPagamento": "dinheiro",
  "descontoPercentual": 10,
  "subtotal": 39.96,
  "desconto": 4.00,
  "total": 35.96,
  "valorRecebido": 50.00,
  "troco": 14.04,
  "itens": [
    {
      "produtoId": "p5",
      "quantidade": 4,
      "precoUnitario": 9.99
    }
  ]
}
```
- **Response Body (`201 Created`)**: `numero` aparece na confirmação do PDV ("Venda #1025 finalizada").
```json
{
  "id": "v1025",
  "numero": 1025,
  "pedidoId": "ped-107",
  "cliente": "Ana Beatriz Souza",
  "status": "Concluída",
  "itens": 4,
  "subtotal": 39.96,
  "desconto": 4.00,
  "total": 35.96,
  "troco": 14.04,
  "formaPagamento": "dinheiro",
  "data": "2026-10-10T14:35:00-03:00"
}
```
*(`cliente` é `"Consumidor final"` quando `clienteId` é `null`; `itens` é a soma das quantidades.)*

---

### 5.2 Últimas Vendas
- **Endpoint**: `GET /api/vendas/recentes`
- **Query Params opcionais**: `limite` (padrão `6`, usado no Dashboard)
- **Response Body (`200 OK`)**: ordenado da mais recente para a mais antiga. `status`: `"Concluída"`, `"Pendente"` ou `"Cancelada"`.
```json
[
  {
    "id": "v1025",
    "cliente": "Ana Beatriz Souza",
    "total": 35.96,
    "status": "Concluída",
    "itens": 4,
    "data": "2026-10-10T14:35:00-03:00"
  },
  {
    "id": "v1024",
    "cliente": "Ana Beatriz Souza",
    "total": 87.40,
    "status": "Concluída",
    "itens": 5,
    "data": "2026-09-29T14:32:00-03:00"
  }
]
```

---

## 6. Kanban de Pedidos (`/api/pedidos`)

### 6.1 Listar Pedidos do Kanban
- **Endpoint**: `GET /api/pedidos`
- **Response Body (`200 OK`)**: ordenado do mais recente para o mais antigo. `pagamento` vem já como texto de exibição: `"Dinheiro"`, `"Cartão"` ou `"PIX"`. `cliente` pode ser `"Consumidor final"`.
```json
[
  {
    "id": "ped-107",
    "cliente": "Ana Beatriz Souza",
    "total": 35.96,
    "status": "pendente",
    "itens": 4,
    "pagamento": "Dinheiro",
    "data": "2026-10-10T14:35:00-03:00"
  },
  {
    "id": "ped-103",
    "cliente": "Ana Beatriz Souza",
    "total": 87.40,
    "status": "em_preparo",
    "itens": 5,
    "pagamento": "Dinheiro",
    "data": "2026-09-29T14:20:00-03:00"
  },
  {
    "id": "ped-105",
    "cliente": "Mercado Central LTDA",
    "total": 423.90,
    "status": "finalizado",
    "itens": 18,
    "pagamento": "PIX",
    "data": "2026-09-29T13:50:00-03:00"
  }
]
```

---

### 6.2 Atualizar Status do Pedido (Arrastar Card no Kanban)
- **Endpoint**: `PATCH /api/pedidos/:id/status`
- **Regras**: valores válidos: `"pendente"`, `"em_preparo"`, `"finalizado"`. O card pode ser arrastado para qualquer coluna, inclusive para trás. Valor inválido → `400`; pedido inexistente → `404`.
- **Request Body**:
```json
{
  "status": "em_preparo"
}
```
- **Response Body (`200 OK`)**:
```json
{
  "id": "ped-107",
  "status": "em_preparo",
  "mensagem": "Status do pedido atualizado com sucesso"
}
```

---

## 7. Financeiro (`/api/financeiro`)

### Categorias de movimentação
Usadas no formulário de nova movimentação:
- **Saída**: `"Fornecedores"`, `"Fixos"`, `"Pessoal"`, `"Impostos"`, `"Outros"`
- **Entrada**: `"Vendas"`, `"Serviços"`, `"Outros"`

---

### 7.1 Listar Movimentações / Transações
- **Endpoint**: `GET /api/financeiro/transacoes`
- **Query Params opcionais**: `tipo` (`entrada` ou `saida`), `dataInicio` e `dataFim` (`AAAA-MM-DD`)
- **Response Body (`200 OK`)**: ordenado por `data` decrescente. Os cards de Receitas, Despesas e Lucro Líquido são somados pelo front a partir desta lista, e a exportação CSV também é feita pelo front.
```json
[
  {
    "id": "t9",
    "descricao": "Venda PDV #1025",
    "tipo": "entrada",
    "valor": 35.96,
    "data": "2026-10-10",
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
- **Regras de validação** (violação → `400`):
  - `descricao` obrigatória
  - `valor` > 0 (sempre positivo; o sinal vem do `tipo`)
  - `tipo`: `"entrada"` ou `"saida"`
  - `categoria` deve ser uma das listadas acima para o `tipo` informado
  - `data` no formato `AAAA-MM-DD` (o formulário sugere a data de hoje)
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
  "id": "t10",
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
- **Query Params opcionais**: `meses` (padrão `6`)
- **Response Body (`200 OK`)**: do mês mais antigo para o mais recente. `mes` é o rótulo exibido no gráfico; `anoMes` identifica o período.
```json
[
  { "anoMes": "2026-05", "mes": "Mai", "receitas": 13900, "despesas": 7800 },
  { "anoMes": "2026-06", "mes": "Jun", "receitas": 15200, "despesas": 9100 },
  { "anoMes": "2026-07", "mes": "Jul", "receitas": 14600, "despesas": 8600 },
  { "anoMes": "2026-08", "mes": "Ago", "receitas": 16800, "despesas": 9400 },
  { "anoMes": "2026-09", "mes": "Set", "receitas": 18300, "despesas": 10100 },
  { "anoMes": "2026-10", "mes": "Out", "receitas": 3120, "despesas": 1480 }
]
```

---

## 8. Dashboard & Relatórios (`/api/dashboard` e `/api/relatorios`)

### 8.1 KPIs do Dashboard
- **Endpoint**: `GET /api/dashboard/kpis`
- **Cálculos**:
  - `vendasHoje`: soma do `total` das vendas `"Concluída"` do dia
  - `ticketMedio`: `vendasHoje ÷ quantidade de vendas do dia` (0 se não houver vendas)
  - `produtosEmBaixa`: produtos com status `"Sem Estoque"`, `"Crítico"` ou `"Baixo"` (seção 3)
  - `faturamentoMensal`: soma das vendas `"Concluída"` do mês corrente
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

### 8.2 Vendas por Dia (Gráfico de Área / Barras)
- **Endpoint**: `GET /api/relatorios/vendas-por-dia`
- **Query Params**: `dataInicio` e `dataFim` (`AAAA-MM-DD`, inclusive). Sem parâmetros: últimos 8 dias (Dashboard). `dataInicio > dataFim` → `400`.
- **Response Body (`200 OK`)**: um item por dia do período, **incluindo dias sem venda** (`vendas: 0`), em ordem cronológica. `data` é usada no filtro e no CSV; `dia` é o rótulo do gráfico. O card "Faturamento no período" é a soma de `vendas`.
```json
[
  { "data": "2026-09-22", "dia": "22/09", "vendas": 1240 },
  { "data": "2026-09-23", "dia": "23/09", "vendas": 980 },
  { "data": "2026-09-24", "dia": "24/09", "vendas": 1560 },
  { "data": "2026-09-25", "dia": "25/09", "vendas": 1320 },
  { "data": "2026-09-26", "dia": "26/09", "vendas": 2100 },
  { "data": "2026-09-27", "dia": "27/09", "vendas": 2890 },
  { "data": "2026-09-28", "dia": "28/09", "vendas": 2450 },
  { "data": "2026-09-29", "dia": "29/09", "vendas": 1870 }
]
```

---

### 8.3 Vendas por Categoria (Gráfico Donut/Pizza)
- **Endpoint**: `GET /api/relatorios/vendas-por-categoria`
- **Query Params opcionais**: `dataInicio` e `dataFim` (`AAAA-MM-DD`)
- **Response Body (`200 OK`)**: ordenado por `valor` decrescente.
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
- **Query Params opcionais**: `dataInicio`, `dataFim` e `limite` (padrão `5`)
- **Response Body (`200 OK`)**: ordenado por `vendas` (unidades) decrescente.
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
- **Query Params opcionais**: `dataInicio`, `dataFim` e `limite` (padrão `5`)
- **Response Body (`200 OK`)**: ordenado por `total` decrescente. Vendas para "Consumidor final" não entram.
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

## 9. Configurações (`/api/configuracoes`)

> A tela de Configurações ainda não salva estes dados; os campos abaixo são os que ela exibe. A opção **Restaurar dados de demonstração** é exclusiva do modo demonstração e não tem endpoint.

### 9.1 Obter Configurações
- **Endpoint**: `GET /api/configuracoes`
- **Response Body (`200 OK`)**: `impressao.modelo` é um de `"Térmica 80mm"`, `"Térmica 58mm"` ou `"A4"`.
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
- **Request Body**: o objeto completo (mesmo formato do 9.1).
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
- **Response Body (`200 OK`)**: as configurações salvas (mesmo formato do 9.1).

---

### 9.3 Encerrar Outras Sessões
Botão **Encerrar outras sessões** da seção Segurança.
- **Endpoint**: `POST /api/auth/sessions/revoke-others`
- **Response Body (`200 OK`)**: invalida todos os tokens do usuário, exceto o da requisição atual.
```json
{
  "sucesso": true,
  "sessoesEncerradas": 2
}
```
