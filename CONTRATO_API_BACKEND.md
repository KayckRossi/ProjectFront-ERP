# 📑 Contrato de API — Nexora ERP & PDV (Front-end ➔ Back-end)

Este documento especifica todos os endpoints REST, formatos de dados (JSON) esperados no envio (`Request Body`) e os retornos esperados (`Response Body`) pelo Front-end.

> **Situação atual do front-end:** todas as telas já consomem esta API.
> - Com `VITE_API_URL` definida, as chamadas vão para o backend real.
> - Sem ela, um **servidor de demonstração** dentro do navegador (`src/api/demo/`) responde exatamente estas rotas. Ele é a **implementação de referência** do contrato: na dúvida sobre uma regra, consulte `src/api/demo/dominio/` (um arquivo por módulo) e `src/lib/permissoes.js`.
> - Para verificar se o backend segue o contrato, rode os testes da seção [16](#16-validando-o-backend).

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
**Backoffice (retaguarda)**

10. [Perfis e permissões](#10-perfis-e-permissões)
11. [Usuários](#11-usuários-apiusuarios)
12. [Caixa](#12-caixa-apicaixa)
13. [Fornecedores](#13-fornecedores-apifornecedores)
14. [Compras e Entrada de Mercadorias](#14-compras-e-entrada-de-mercadorias-apicompras)
15. [Auditoria](#15-auditoria-apiauditoria)
16. [Validando o backend](#16-validando-o-backend)

---

## 0. Convenções Gerais

- **Base URL**: definida no front pela variável `VITE_API_URL`. Todas as rotas começam com `/api`.
  - URL completa (ex.: `http://localhost:3000`): o navegador chama o backend diretamente — o backend precisa liberar **CORS** para a origem do front, com os headers `Content-Type` e `Authorization`.
  - `VITE_API_URL=/`: o front chama a própria origem. Em desenvolvimento, `API_PROXY_TARGET=http://localhost:3000` faz o Vite encaminhar `/api` para o backend (sem CORS). Em produção, use um proxy/rewrite de `/api` para o backend ou sirva o front pelo próprio backend.
- **Formato**: `Content-Type: application/json` no envio e no retorno; campos em português e `camelCase`.
- **Permissões**: cada rota exige uma permissão do perfil do usuário (seção 10). Sem ela → `403`, verificado **antes** de procurar o registro. Ao receber `403`, o front mostra a `mensagem` e mantém o usuário na tela.
- **Autenticação**: todas as rotas, exceto as marcadas como públicas na seção 1, exigem `Authorization: Bearer <access_token>`. Sem token ou com token inválido/expirado → `401`. Ao receber `401` em qualquer rota autenticada, o front descarta o token e volta para o login, guardando a página em que o usuário estava.
- **IDs**: sempre `string` (ex.: `"p1"`, `"c3"`, `"v1025"`, `"ped-107"`, `"t9"`). O front não presume o formato do id; o número da venda fica no campo `numero`.
- **Valores monetários**: `number` em reais com até 2 casas decimais (ex.: `35.96`). Nunca strings formatadas.
- **Datas**:
  - Data com horário: ISO 8601 com fuso (ex.: `"2026-10-10T14:32:00-03:00"` ou `"2026-10-10T17:32:00Z"`).
  - Data sem horário: `"AAAA-MM-DD"` (ex.: `"2026-09-29"`). O front exibe como data local, sem conversão de fuso.
  - Agrupamentos por dia (relatórios, "vendas de hoje", filtros de período) usam o **fuso da loja** (`America/Sao_Paulo`).
- **Períodos**: parâmetros `dataInicio` e `dataFim` no formato `AAAA-MM-DD`, ambos **inclusivos**. Quando ausentes, cada endpoint usa o padrão indicado. `dataInicio` depois de `dataFim` ou período maior que **366 dias** → `400`.
- **Buscas** (`busca`): ignoram maiúsculas/minúsculas e acentos (`"feijao"` encontra `"Feijão"`).
- **Listas**: retornam um array JSON diretamente (sem envelope).
- **Criação/atualização**: `POST` e `PUT` retornam o **registro completo** salvo, para o front substituir o item na tela sem recarregar a lista.
- **Erros**: status HTTP adequado e um corpo com a mensagem que o front exibe ao usuário:

| Status | Quando usar |
|---|---|
| `400` | Dados inválidos (campo obrigatório ausente, valor fora da regra, período inválido) |
| `401` | Não autenticado, token inválido ou credenciais incorretas no login |
| `403` | Autenticado, mas o perfil não tem permissão (seção 10), ou login de usuário desativado |
| `404` | Registro não encontrado |
| `409` | Conflito (e-mail/SKU/documento duplicado, estoque insuficiente, venda já cancelada, caixa fechado) |
| `500` | Erro inesperado |

```json
{
  "mensagem": "Estoque insuficiente para Feijão Carioca 1kg (disponível: 4)."
}
```

---

## 1. Autenticação (`/api/auth`)

> O token é salvo no navegador e enviado como `Bearer` em todas as requisições.
> Login com Google existe apenas no modo demonstração; não há endpoint de OAuth neste contrato.
> O campo `role` do usuário (`admin`, `gerente` ou `operador`) define o que ele pode fazer (seção 10). O cadastro público (1.1) cria a conta da empresa, com perfil `admin`; os demais usuários são criados pelo administrador em Usuários (seção 11).

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
- **Erros**: e-mail ou senha incorretos → **`401`** (o front exibe "E-mail ou senha incorretos"); usuário desativado → **`403`** com `mensagem`. Qualquer outro status exibe o campo `mensagem` retornado.
- O login atualiza o `ultimoAcesso` do usuário (seção 11).

---

### 1.5 Usuário Autenticado Atual
- **Endpoint**: `GET /api/auth/me`
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

### 1.8 Encerrar Outras Sessões
Botão **Encerrar outras sessões** em Configurações → Segurança.
- **Endpoint**: `POST /api/auth/sessions/revoke-others`
- **Response Body (`200 OK`)**: invalida todos os tokens do usuário, exceto o da requisição atual.
```json
{
  "sucesso": true,
  "sessoesEncerradas": 2
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

### 2.1.1 Criar, Atualizar e Excluir Categoria
Tela **Backoffice → Categorias** (permissão `categorias.gerenciar`).
- **Endpoints**: `POST /api/categorias` (`201`), `PUT /api/categorias/:id` (`200`) e `DELETE /api/categorias/:id` (`200`, `{ "sucesso": true, "mensagem": "..." }`)
- **Request Body**: `{ "nome": "Hortifruti", "cor": "#4CAF50" }`
- **Regras**: `nome` obrigatório (`400`); `cor` no formato `#RRGGBB` (`400`; padrão `#339989`, salva em maiúsculas); nome já usado, ignorando maiúsculas e acentos → `409`; excluir categoria com produtos → `409` (a `mensagem` diz quantos).
- **id**: gerado pelo backend a partir do nome (ex.: `"hortifruti"`) e **não muda** quando o nome muda, porque os produtos guardam o id da categoria.

---

### 2.2 Listar Produtos
- **Endpoint**: `GET /api/produtos`
- **Query Params opcionais**:
  - `categoria` — id da categoria (ex.: `bebidas`)
  - `busca` — procura no **nome ou SKU**
  - `codigoBarras` — busca exata pelo código de barras (também deve aceitar o SKU)
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
  }
]
```

---

### 2.3 Criar Produto
- **Endpoint**: `POST /api/produtos`
- **Regras de validação** (as mesmas aplicadas no formulário):
  - `nome` obrigatório (o front envia sem espaços nas pontas) → `400`
  - `preco` > 0 e `preco` ≥ `custo`; `custo` ≥ 0 → `400`
  - `estoque` e `estoqueMinimo` inteiros ≥ 0 → `400`
  - `categoria` deve existir em `/api/categorias` → `400`
  - `sku` é opcional e enviado em **maiúsculas**; se informado, deve ser único → `409`
  - `codigoBarras` é opcional; se informado, deve ser único → `409`. **Sem código de barras, o backend gera um** (o servidor de demonstração gera um EAN-13 com prefixo `789`)
- **Request Body**:
```json
{
  "nome": "Água com Gás 500ml",
  "sku": "BEB005",
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
  "id": "p17",
  "nome": "Água com Gás 500ml",
  "sku": "BEB005",
  "categoria": "bebidas",
  "custo": 1.50,
  "preco": 4.00,
  "estoque": 50,
  "estoqueMinimo": 10,
  "codigoBarras": "7890000000178"
}
```

---

### 2.4 Atualizar Produto
- **Endpoint**: `PUT /api/produtos/:id`
- **Regras**: as mesmas da criação. Produto inexistente → `404`. `codigoBarras` ausente mantém o atual.
- **Request Body**: mesmos campos da criação.
- **Response Body (`200 OK`)**: o produto completo atualizado (mesmo formato do 2.3).

---

### 2.5 Excluir Produto
- **Endpoint**: `DELETE /api/produtos/:id`
- **Observação**: vendas guardam nome e categoria do produto (5.1), então o histórico continua legível após a exclusão. Produto inexistente → `404`.
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
Usada nos filtros do Estoque, nas notificações e no KPI "Produtos em Baixa":

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
  - outro valor de `filtro` → `400`
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
  - `tipo`: `"entrada"` (soma) ou `"saida"` (subtrai: perda, avaria, uso interno) → senão `400`
  - `quantidade`: inteiro > 0 → senão `400`
  - saída maior que o estoque atual → `409`; produto inexistente → `404`
  - vendas do PDV **não** usam este endpoint; a baixa é feita pelo `POST /api/vendas`
- **Request Body**:
```json
{
  "produtoId": "p5",
  "tipo": "entrada",
  "quantidade": 20
}
```
- **Response Body (`201 Created`)**: o produto com o estoque atualizado (mesmo formato do 3.1).
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
- **Query Params opcionais**: `busca` — procura no nome, e-mail ou documento (no documento, comparar **apenas os dígitos**: `12345678900` encontra `123.456.789-00`).
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
  }
]
```

---

### 4.2 Cadastrar Cliente
- **Endpoint**: `POST /api/clientes`
- **Regras de validação**:
  - `nome` obrigatório → `400`
  - `documento` opcional; quando enviado tem 11 dígitos (CPF) ou 14 (CNPJ) → senão `400`. O front envia **com máscara** (`123.456.789-00` / `12.345.678/0001-90`). Documento já cadastrado (comparando só os dígitos) → `409`
  - `telefone` opcional, com DDD e 8 ou 9 dígitos (10 ou 11 dígitos no total) → senão `400`. Enviado com máscara (`(11) 3333-4444` ou `(11) 97777-8888`)
  - `email` opcional; quando enviado deve ser válido → senão `400`
  - `totalCompras` **não** é enviado: começa em `0` e é atualizado pelas vendas e cancelamentos (seção 5)
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
- **Regras**: as mesmas do cadastro. `totalCompras` não é alterado por esta rota. Cliente inexistente → `404`.
- **Response Body (`200 OK`)**: o cliente completo atualizado (mesmo formato do 4.2).

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

### Formato da venda
Usado na resposta do `POST /api/vendas`, do detalhe (5.3) e do cancelamento (5.4):
```json
{
  "id": "v1025",
  "numero": 1025,
  "pedidoId": "ped-107",
  "clienteId": "c1",
  "cliente": "Ana Beatriz Souza",
  "status": "Concluída",
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
      "nome": "Feijão Carioca 1kg",
      "categoria": "alimentos",
      "quantidade": 4,
      "precoUnitario": 9.99,
      "totalItem": 39.96
    }
  ],
  "data": "2026-10-10T14:35:00-03:00",
  "caixaId": "cx165",
  "usuarioId": "u3",
  "operador": "Lucas Ferreira"
}
```
- `status`: `"Concluída"` ou `"Cancelada"`. Vendas canceladas também trazem `canceladaEm` (data e hora), `motivoCancelamento` (texto ou `null`) e `canceladaPor` (nome de quem cancelou).
- `caixaId`, `usuarioId` e `operador`: o caixa (seção 12) e o usuário que registrou a venda. `operador` aparece no cupom. `caixaId` é `null` quando a venda foi feita sem caixa aberto (com `pdv.exigirCaixaAberto` desligado).
- `cliente` é `"Consumidor final"` e `clienteId` é `null` quando a venda não tem cliente.
- `valorRecebido` e `troco` são `null` quando o pagamento não é em dinheiro.
- Cada item guarda `nome` e `categoria` do momento da venda, para o histórico e os relatórios não dependerem do cadastro atual.

---

### 5.1 Finalizar Venda (Checkout PDV)
- **Endpoint**: `POST /api/vendas`
- **Campos enviados**:
  - `clienteId`: id do cliente ou `null` (consumidor final). Cliente inexistente → `400`
  - `formaPagamento`: `"dinheiro"`, `"cartao"` ou `"pix"` → senão `400`
  - `descontoPercentual`: de `0` a `100` → senão `400` (o PDV oferece 5%, 10%, 15% ou valor livre)
  - `subtotal`, `desconto` (em R$) e `total`: calculados pelo front, enviados para conferência
  - `valorRecebido` e `troco`: apenas quando `formaPagamento` = `"dinheiro"`; caso contrário `null`
  - `itens[].quantidade`: **inteiro** ≥ 1 (o PDV não vende fracionado). Itens repetidos do mesmo produto são somados
- **Validações do backend**:
  - recalcular os valores com os **preços do cadastro**: `subtotal = Σ arredondar(preco × quantidade)`, `desconto = arredondar(subtotal × descontoPercentual / 100)`, `total = subtotal − desconto` (arredondamento em centavos). Se `total` foi enviado e difere do calculado → `400` (o front recarrega os preços e mostra a mensagem)
  - produto inexistente → `400`; estoque insuficiente em qualquer item → `409`, citando o produto na `mensagem`
  - pagamento em dinheiro sem `valorRecebido` ou com `valorRecebido < total` → `400`
  - carrinho vazio → `400`
  - com `configuracoes.pdv.exigirCaixaAberto` ligado (padrão) e o usuário sem caixa aberto → `409` ("Abra o caixa antes de registrar vendas."). O PDV então mostra a abertura de caixa
- **Efeitos (na mesma transação do banco, só depois de todas as validações)**:
  1. baixa `quantidade` do estoque de cada produto
  2. cria a venda com status `"Concluída"` e o próximo `numero` sequencial
  3. cria um pedido no Kanban com status `"pendente"` (seção 6)
  4. lança uma **entrada** no financeiro: descrição `"Venda PDV #<numero>"`, categoria `"Vendas"`, data do dia, `vendaId` preenchido (seção 7). Venda de total zero (100% de desconto) não gera lançamento
  5. se houver `clienteId`, soma `total` ao `totalCompras` do cliente
  6. vincula a venda ao caixa aberto do usuário (`caixaId`) e guarda `usuarioId` e `operador`
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
    { "produtoId": "p5", "quantidade": 4, "precoUnitario": 9.99 }
  ]
}
```
- **Response Body (`201 Created`)**: a venda completa ([formato da venda](#formato-da-venda)). O PDV usa a resposta para mostrar e imprimir o cupom.

---

### 5.2 Listar Vendas (Histórico)
Tela **Vendas**.
- **Endpoint**: `GET /api/vendas`
- **Query Params opcionais**:
  - `dataInicio`, `dataFim` — padrão: últimos 30 dias
  - `status` — `Concluída` ou `Cancelada` → senão `400`
  - `formaPagamento` — `dinheiro`, `cartao` ou `pix` → senão `400`
  - `clienteId` — vendas de um cliente (botão "Ver compras" em Clientes)
  - `busca` — nome do cliente ou parte do número da venda
  - `numero` — busca exata pelo número da venda; **ignora o período e os demais filtros** (usado pela busca global do cabeçalho)
  - `caixaId` — vendas de um caixa (detalhe do caixa no backoffice)
- **Response Body (`200 OK`)**: resumo das vendas, da mais recente para a mais antiga. `itens` é a soma das quantidades.
```json
[
  {
    "id": "v1025",
    "numero": 1025,
    "clienteId": "c1",
    "cliente": "Ana Beatriz Souza",
    "total": 35.96,
    "status": "Concluída",
    "itens": 4,
    "formaPagamento": "dinheiro",
    "data": "2026-10-10T14:35:00-03:00",
    "operador": "Lucas Ferreira"
  }
]
```

---

### 5.3 Detalhe da Venda
- **Endpoint**: `GET /api/vendas/:id`
- **Response Body (`200 OK`)**: a venda completa ([formato da venda](#formato-da-venda)). Venda inexistente → `404`.

---

### 5.4 Cancelar Venda
Botão **Cancelar venda** no detalhe da venda.
- **Endpoint**: `POST /api/vendas/:id/cancelar`
- **Request Body** (opcional):
```json
{
  "motivo": "Cliente desistiu da compra"
}
```
- **Permissão**: `vendas.cancelar` (o operador de caixa não cancela vendas).
- **Regras**: venda inexistente → `404`; venda já cancelada → `409`.
- **Efeitos** (desfazem os da venda):
  1. devolve ao estoque a quantidade de cada item (produtos excluídos são ignorados)
  2. marca a venda como `"Cancelada"`, com `canceladaEm`, `motivoCancelamento` e `canceladaPor`
  3. abate o `total` do `totalCompras` do cliente (sem ficar negativo)
  4. tira o pedido do Kanban (o pedido passa a `"cancelado"` e deixa de aparecer em 6.1)
  5. lança uma **saída** no financeiro: descrição `"Estorno da venda #<numero>"`, categoria `"Estornos"`, data do cancelamento, `vendaId` preenchido
- **Response Body (`200 OK`)**: a venda atualizada ([formato da venda](#formato-da-venda)), com `status: "Cancelada"`.

---

### 5.5 Últimas Vendas
Tabela "Últimas Vendas" do Dashboard.
- **Endpoint**: `GET /api/vendas/recentes`
- **Query Params opcionais**: `limite` (padrão `6`, de 1 a 50)
- **Atenção**: esta rota deve ter prioridade sobre `GET /api/vendas/:id`.
- **Response Body (`200 OK`)**: mesmo formato do 5.2, da mais recente para a mais antiga, incluindo canceladas.

---

## 6. Kanban de Pedidos (`/api/pedidos`)

### 6.1 Listar Pedidos do Kanban
- **Endpoint**: `GET /api/pedidos`
- **Regras**: devolve os pedidos `pendente` e `em_preparo` de qualquer data e os `finalizado` atualizados nas **últimas 24 horas**. Pedidos de vendas canceladas não aparecem. O front atualiza esta lista a cada 15 segundos para mostrar pedidos de outros caixas.
- **Response Body (`200 OK`)**: do mais recente para o mais antigo. `pagamento` vem como texto de exibição: `"Dinheiro"`, `"Cartão"` ou `"PIX"`.
```json
[
  {
    "id": "ped-107",
    "vendaId": "v1025",
    "cliente": "Ana Beatriz Souza",
    "total": 35.96,
    "status": "pendente",
    "itens": 4,
    "pagamento": "Dinheiro",
    "data": "2026-10-10T14:35:00-03:00",
    "atualizadoEm": "2026-10-10T14:35:00-03:00"
  }
]
```

---

### 6.2 Atualizar Status do Pedido (Arrastar Card no Kanban)
- **Endpoint**: `PATCH /api/pedidos/:id/status`
- **Regras**: valores válidos: `"pendente"`, `"em_preparo"`, `"finalizado"` → senão `400`. O card pode ir para qualquer coluna, inclusive para trás. Pedido inexistente → `404`; pedido de venda cancelada → `409`. Atualiza `atualizadoEm`.
- **Request Body**:
```json
{
  "status": "em_preparo"
}
```
- **Response Body (`200 OK`)**: o front já move o card antes da resposta e o devolve à coluna anterior se houver erro.
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
- **Saída** (lançamento manual): `"Fornecedores"`, `"Fixos"`, `"Pessoal"`, `"Impostos"`, `"Outros"`
- **Entrada** (lançamento manual): `"Vendas"`, `"Serviços"`, `"Outros"`
- **Automáticas**: `"Vendas"` (entrada gerada pela venda), `"Estornos"` (saída gerada pelo cancelamento) e `"Fornecedores"` (saída gerada pelo recebimento de uma compra, seção 14). `"Estornos"` não é aceita no lançamento manual.

---

### 7.1 Listar Movimentações / Transações
- **Endpoint**: `GET /api/financeiro/transacoes`
- **Query Params opcionais**: `dataInicio`, `dataFim` (padrão: últimos 30 dias) e `tipo` (`entrada` ou `saida` → senão `400`)
- **Response Body (`200 OK`)**: ordenado por `data` decrescente. Lançamentos automáticos trazem `vendaId` ou `compraId` (o front cria um link para a venda ou a compra). Os cards de Receitas, Despesas e Saldo do período e a exportação CSV são calculados pelo front a partir desta lista.
```json
[
  {
    "id": "t2311",
    "descricao": "Venda PDV #1025",
    "tipo": "entrada",
    "valor": 35.96,
    "data": "2026-10-10",
    "categoria": "Vendas",
    "vendaId": "v1025"
  },
  {
    "id": "t2290",
    "descricao": "Aluguel da loja",
    "tipo": "saida",
    "valor": 2200.00,
    "data": "2026-10-05",
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
  - `categoria` deve ser uma das categorias de lançamento manual do `tipo` informado
  - `data` válida no formato `AAAA-MM-DD` (o formulário sugere a data de hoje)
- **Request Body**:
```json
{
  "descricao": "Conta de Internet Fibra",
  "tipo": "saida",
  "valor": 149.90,
  "categoria": "Fixos",
  "data": "2026-10-10"
}
```
- **Response Body (`201 Created`)**:
```json
{
  "id": "t2312",
  "descricao": "Conta de Internet Fibra",
  "tipo": "saida",
  "valor": 149.90,
  "data": "2026-10-10",
  "categoria": "Fixos"
}
```

---

### 7.3 Balanço Financeiro Mensal (Gráfico Receitas x Despesas)
- **Endpoint**: `GET /api/financeiro/mensal`
- **Query Params opcionais**: `meses` (padrão `6`, de 1 a 24)
- **Response Body (`200 OK`)**: do mês mais antigo para o mais recente, terminando no mês atual. `mes` é o rótulo do gráfico; `anoMes` identifica o período. `receitas` soma as entradas e `despesas` soma as saídas do mês (estornos incluídos).
```json
[
  { "anoMes": "2026-05", "mes": "Mai", "receitas": 15496.26, "despesas": 10742.79 },
  { "anoMes": "2026-06", "mes": "Jun", "receitas": 16015.11, "despesas": 11982.39 },
  { "anoMes": "2026-07", "mes": "Jul", "receitas": 16074.46, "despesas": 11466.93 },
  { "anoMes": "2026-08", "mes": "Ago", "receitas": 16251.43, "despesas": 12578.03 },
  { "anoMes": "2026-09", "mes": "Set", "receitas": 15955.10, "despesas": 11745.48 },
  { "anoMes": "2026-10", "mes": "Out", "receitas": 5378.07, "despesas": 7341.51 }
]
```

---

## 8. Dashboard & Relatórios (`/api/dashboard` e `/api/relatorios`)

> Todos os relatórios consideram apenas vendas **concluídas**. Nos relatórios por produto e por categoria, o desconto de cada venda é rateado entre os itens (`totalItem × total / subtotal`), para que a soma bata com o faturamento.

### 8.1 KPIs do Dashboard
- **Endpoint**: `GET /api/dashboard/kpis`
- **Cálculos**:
  - `vendasHoje`: soma do `total` das vendas concluídas do dia
  - `quantidadeVendasHoje`: quantidade dessas vendas
  - `ticketMedio`: `vendasHoje ÷ quantidadeVendasHoje` (0 se não houver vendas)
  - `produtosEmBaixa`: produtos com status `"Sem Estoque"`, `"Crítico"` ou `"Baixo"` (seção 3)
  - `faturamentoMensal`: soma das vendas concluídas do mês corrente
- **Response Body (`200 OK`)**:
```json
{
  "vendasHoje": 655.23,
  "quantidadeVendasHoje": 13,
  "ticketMedio": 50.40,
  "produtosEmBaixa": 5,
  "faturamentoMensal": 10504.08
}
```

---

### 8.2 Vendas por Dia (Gráficos do Dashboard e de Relatórios)
- **Endpoint**: `GET /api/relatorios/vendas-por-dia`
- **Query Params**: `dataInicio` e `dataFim` (padrão: últimos 7 dias)
- **Response Body (`200 OK`)**: um item por dia do período, **incluindo dias sem venda** (`vendas: 0`), em ordem cronológica. `data` é usada no filtro e no CSV; `dia` é o rótulo do gráfico. O "Faturamento no período" de Relatórios é a soma de `vendas`.
```json
[
  { "data": "2026-10-04", "dia": "04/10", "vendas": 415.12 },
  { "data": "2026-10-05", "dia": "05/10", "vendas": 0 },
  { "data": "2026-10-06", "dia": "06/10", "vendas": 395.52 }
]
```

---

### 8.3 Vendas por Categoria (Gráfico de Pizza)
- **Endpoint**: `GET /api/relatorios/vendas-por-categoria`
- **Query Params opcionais**: `dataInicio`, `dataFim` (padrão: últimos 30 dias)
- **Response Body (`200 OK`)**: ordenado por `valor` decrescente; categorias sem venda não aparecem.
```json
[
  { "categoria": "alimentos", "nome": "Alimentos", "valor": 6746.38 },
  { "categoria": "bebidas", "nome": "Bebidas", "valor": 3213.94 }
]
```

---

### 8.4 Produtos Mais Vendidos
- **Endpoint**: `GET /api/relatorios/produtos-mais-vendidos`
- **Query Params opcionais**: `dataInicio`, `dataFim` (padrão: últimos 30 dias) e `limite` (padrão `5`, de 1 a 50)
- **Response Body (`200 OK`)**: ordenado por `vendas` (unidades) decrescente e, no empate, por `receita`. `nome` é o nome atual do produto (ou o da venda, se ele foi excluído).
```json
[
  { "produtoId": "p1", "nome": "Refrigerante Cola 2L", "vendas": 62, "receita": 551.30 },
  { "produtoId": "p5", "nome": "Feijão Carioca 1kg", "vendas": 49, "receita": 484.12 }
]
```

---

### 8.5 Melhores Clientes
- **Endpoint**: `GET /api/relatorios/melhores-clientes`
- **Query Params opcionais**: `dataInicio`, `dataFim` (padrão: últimos 30 dias) e `limite` (padrão `5`, de 1 a 50)
- **Response Body (`200 OK`)**: ordenado por `total` decrescente. Vendas para "Consumidor final" não entram.
```json
[
  { "clienteId": "c6", "nome": "Loja do Bairro ME", "total": 1130.90, "compras": 7 },
  { "clienteId": "c3", "nome": "Mercado Central LTDA", "total": 588.52, "compras": 3 }
]
```

---

## 9. Configurações (`/api/configuracoes`)

> A opção **Restaurar dados de demonstração** existe só no modo demonstração e não tem endpoint.

### 9.1 Obter Configurações
- **Endpoint**: `GET /api/configuracoes`
- **Response Body (`200 OK`)**: `loja` e `impressao.mensagemRodape` aparecem no cupom de venda; `impressao.modelo` define a largura do cupom (`"Térmica 80mm"`, `"Térmica 58mm"` ou `"A4"`); com `impressao.automatica` o PDV imprime o cupom ao finalizar a venda; `notificacoes.alertaEstoqueBaixo` liga os alertas de estoque do sino.
```json
{
  "loja": {
    "nome": "Nexora Market",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 3333-4444",
    "endereco": "Rua das Flores, 123 - Centro, São Paulo/SP"
  },
  "notificacoes": {
    "push": true,
    "alertaEstoqueBaixo": true
  },
  "impressao": {
    "automatica": false,
    "modelo": "Térmica 80mm",
    "mensagemRodape": "Obrigado pela preferência! Volte sempre."
  },
  "seguranca": {
    "doisFatores": false
  },
  "pdv": {
    "exigirCaixaAberto": true
  }
}
```
- `pdv.exigirCaixaAberto` (padrão `true`): exige caixa aberto para registrar vendas (seção 12). Ausente = `true`.

---

### 9.2 Atualizar Configurações
- **Endpoint**: `PUT /api/configuracoes`
- **Permissão**: `configuracoes.gerenciar` (só administrador). A leitura (9.1) é liberada a todos, porque o cupom usa os dados da loja.
- **Regras** (violação → `400`): `loja.nome` obrigatório; `loja.cnpj`, se informado, com 14 dígitos; `loja.telefone`, se informado, com 10 ou 11 dígitos; `impressao.modelo` entre os três modelos aceitos.
- **Request Body**: o objeto completo (mesmo formato do 9.1).
- **Response Body (`200 OK`)**: as configurações salvas (mesmo formato do 9.1).

---

## 10. Perfis e permissões

Todo usuário tem um perfil (`role`), devolvido no login e em `GET /api/auth/me`. O front esconde menus e telas conforme a tabela abaixo (`src/lib/permissoes.js`), mas **o backend deve aplicar as mesmas regras** e responder `403` com `mensagem` quando o perfil não tiver a permissão. A permissão é verificada **antes** de buscar o registro: um operador que tenta cancelar uma venda inexistente recebe `403`, não `404`.

| Permissão | Rotas | Administrador (`admin`) | Gerente (`gerente`) | Operador de caixa (`operador`) |
|---|---|:-:|:-:|:-:|
| `dashboard.ver` | `GET /api/dashboard/kpis`, `GET /api/vendas/recentes` | ✓ | ✓ | |
| `pdv.operar` | `POST /api/vendas`, `/api/pedidos/*`, `/api/caixa/atual`, `abrir`, `movimentos`, `fechar`, `GET /api/caixa/sessoes/:id` (só os próprios) | ✓ | ✓ | ✓ |
| `vendas.ver` | `GET /api/vendas`, `GET /api/vendas/:id` | ✓ | ✓ | ✓ |
| `vendas.cancelar` | `POST /api/vendas/:id/cancelar` | ✓ | ✓ | |
| `clientes.gerenciar` | `POST`/`PUT /api/clientes` | ✓ | ✓ | ✓ |
| `clientes.excluir` | `DELETE /api/clientes/:id` | ✓ | ✓ | |
| `produtos.gerenciar` | `POST`/`PUT`/`DELETE /api/produtos` | ✓ | ✓ | |
| `categorias.gerenciar` | `POST`/`PUT`/`DELETE /api/categorias` | ✓ | ✓ | |
| `estoque.gerenciar` | `POST /api/estoque/movimentacoes` | ✓ | ✓ | |
| `financeiro.ver` | `/api/financeiro/*` | ✓ | ✓ | |
| `relatorios.ver` | `/api/relatorios/*` | ✓ | ✓ | |
| `fornecedores.gerenciar` | `/api/fornecedores/*` | ✓ | ✓ | |
| `compras.gerenciar` | `/api/compras/*` | ✓ | ✓ | |
| `caixa.ver-todos` | `GET /api/caixa/sessoes`, sessões de outros usuários | ✓ | ✓ | |
| `usuarios.gerenciar` | `/api/usuarios/*` | ✓ | | |
| `auditoria.ver` | `GET /api/auditoria` | ✓ | | |
| `configuracoes.gerenciar` | `PUT /api/configuracoes` | ✓ | | |

Rotas sem permissão específica exigem apenas um usuário autenticado: `GET` de produtos, categorias, estoque, clientes e configurações, `GET /api/auth/me` e `POST /api/auth/sessions/revoke-others`.

---

## 11. Usuários (`/api/usuarios`)

Os usuários não são excluídos: são **desativados**, para manter o histórico de vendas, caixas e auditoria. Um usuário desativado não consegue entrar (`403` no login) e seus tokens deixam de valer (`401`).

### 11.1 Listar Usuários
- **Endpoint**: `GET /api/usuarios`
- **Query Params opcionais**: `busca` (nome ou e-mail), `role`, `ativo` (`true`/`false`)
- **Response Body (`200 OK`)**: nunca inclui senha ou hash.
```json
[
  {
    "id": "u3",
    "nome": "Lucas Ferreira",
    "email": "operador@nexora.com",
    "role": "operador",
    "ativo": true,
    "criadoEm": "2026-05-01T03:00:00Z",
    "ultimoAcesso": "2026-10-09T10:50:00Z"
  }
]
```

---

### 11.2 Criar Usuário
- **Endpoint**: `POST /api/usuarios`
- **Regras**: `nome` obrigatório e `email` válido (`400`); e-mail já usado (`409`, sem diferenciar maiúsculas); `role` entre `admin`, `gerente` e `operador` (`400`).
- **Senha**: o administrador não define a senha. O backend envia ao usuário um e-mail de convite com link para `<url-do-front>/redefinir-senha?token=<token>` (mesmo fluxo da seção 1.7). No modo demonstração a senha inicial é `nexora123`.
- **Request Body**:
```json
{
  "nome": "Carla Souza",
  "email": "carla@nexora.com",
  "role": "operador"
}
```
- **Response Body (`201 Created`)**: o usuário completo (formato do 11.1), com `ativo: true` e `ultimoAcesso: null`.

---

### 11.3 Atualizar Usuário (inclui desativar e reativar)
- **Endpoint**: `PUT /api/usuarios/:id`
- **Request Body**: `nome`, `email`, `role` e `ativo` (booleano; ausente = mantém).
- **Regras**: as mesmas da criação, mais as proteções para ninguém trancar o sistema (`409`):
  - o usuário logado não pode desativar a si mesmo nem alterar o próprio perfil;
  - o sistema precisa manter ao menos um administrador ativo.
- **Response Body (`200 OK`)**: o usuário atualizado.

---

### 11.4 Enviar Redefinição de Senha
- **Endpoint**: `POST /api/usuarios/:id/redefinir-senha`
- **Regras**: usuário inexistente → `404`; usuário desativado → `409`.
- **Response Body (`200 OK`)**: o backend envia o e-mail de redefinição (seção 1.6).
```json
{
  "sucesso": true,
  "mensagem": "E-mail de redefinição de senha enviado para carla@nexora.com."
}
```

---

## 12. Caixa (`/api/caixa`)

Cada usuário tem **no máximo um caixa aberto**. As vendas registradas por ele entram nesse caixa (`venda.caixaId`). Com `configuracoes.pdv.exigirCaixaAberto` ligado (padrão), `POST /api/vendas` sem caixa aberto responde `409` ("Abra o caixa antes de registrar vendas.").

### Formato da sessão de caixa
```json
{
  "id": "cx165",
  "numero": 165,
  "usuarioId": "u1",
  "operador": "Administrador Nexora",
  "status": "fechada",
  "abertaEm": "2026-10-11T16:08:00Z",
  "valorInicial": 150.00,
  "movimentos": [
    { "id": "mv12", "tipo": "sangria", "valor": 50.00, "motivo": "Cofre", "data": "2026-10-11T16:08:40Z" }
  ],
  "fechadaEm": "2026-10-11T16:09:10Z",
  "valorContado": 98.00,
  "observacoes": null,
  "resumo": {
    "quantidadeVendas": 0,
    "vendasCanceladas": 1,
    "totalVendas": 0.00,
    "porFormaPagamento": { "dinheiro": 0.00, "cartao": 0.00, "pix": 0.00 },
    "suprimentos": 0.00,
    "sangrias": 50.00,
    "esperadoEmDinheiro": 100.00,
    "diferenca": -2.00
  }
}
```
- `resumo` é calculado pelo backend a cada resposta: considera só vendas **concluídas** do caixa (canceladas contam em `vendasCanceladas`, porque o dinheiro voltou ao cliente).
- `esperadoEmDinheiro` = `valorInicial` + vendas em dinheiro + suprimentos − sangrias.
- `diferenca` = `valorContado` − `esperadoEmDinheiro` (negativa = falta, positiva = sobra); `null` enquanto o caixa está aberto.

---

### 12.1 Caixa Atual
- **Endpoint**: `GET /api/caixa/atual`
- **Response**: `200 OK` com o caixa aberto do usuário logado, ou **`204 No Content`** quando ele não tem caixa aberto.

### 12.2 Abrir Caixa
- **Endpoint**: `POST /api/caixa/abrir`
- **Request Body**: `{ "valorInicial": 150.00 }` (fundo de troco, ≥ 0 → senão `400`)
- **Regras**: usuário já com caixa aberto → `409`.
- **Response Body (`201 Created`)**: a sessão aberta.

### 12.3 Sangria e Suprimento
- **Endpoint**: `POST /api/caixa/movimentos`
- **Request Body**: `{ "tipo": "sangria", "valor": 50.00, "motivo": "Depósito no cofre" }`
- **Regras**: `tipo` é `sangria` (retirada) ou `suprimento` (reforço) → senão `400`; `valor` > 0 → senão `400`; sem caixa aberto → `409`; sangria maior que o `esperadoEmDinheiro` → `409`.
- **Response Body (`201 Created`)**: a sessão atualizada.

### 12.4 Fechar Caixa
- **Endpoint**: `POST /api/caixa/fechar`
- **Request Body**: `{ "valorContado": 98.00, "observacoes": "Faltaram R$ 2" }` (`valorContado` obrigatório, ≥ 0 → senão `400`)
- **Regras**: sem caixa aberto → `409`.
- **Response Body (`200 OK`)**: a sessão fechada, com `diferenca` calculada. O front mostra e imprime o relatório de fechamento.

### 12.5 Histórico de Caixas
- **Endpoint**: `GET /api/caixa/sessoes`
- **Query Params opcionais**: `dataInicio`, `dataFim` (pela data de abertura; padrão: últimos 30 dias), `status` (`aberta`/`fechada` → senão `400`), `usuarioId`
- **Response Body (`200 OK`)**: lista de sessões (formato acima), da abertura mais recente para a mais antiga.

### 12.6 Detalhe do Caixa
- **Endpoint**: `GET /api/caixa/sessoes/:id`
- **Regras**: o operador só vê os próprios caixas (`403` para os de outros, salvo com `caixa.ver-todos`); inexistente → `404`.

---

## 13. Fornecedores (`/api/fornecedores`)

### 13.1 Listar Fornecedores
- **Endpoint**: `GET /api/fornecedores`
- **Query Params opcionais**: `busca` (razão social, nome fantasia, contato ou dígitos do CNPJ)
- **Response Body (`200 OK`)**:
```json
[
  {
    "id": "f1",
    "razaoSocial": "Atacadão Central Distribuidora LTDA",
    "nomeFantasia": "Atacadão Central",
    "cnpj": "11.222.333/0001-81",
    "contato": "Roberto Nunes",
    "telefone": "(11) 4002-8922",
    "email": "vendas@atacadaocentral.com.br",
    "prazoPagamentoDias": 28,
    "observacoes": "Entrega às segundas e quintas."
  }
]
```

### 13.2 Cadastrar / Atualizar Fornecedor
- **Endpoints**: `POST /api/fornecedores` (`201`) e `PUT /api/fornecedores/:id` (`200`); ambos devolvem o fornecedor completo.
- **Regras** (`400`): `razaoSocial` obrigatória; `cnpj` opcional, com 14 dígitos (enviado com máscara); `telefone` e `email` como em clientes; `prazoPagamentoDias` inteiro de 0 a 365 (padrão 30). CNPJ já cadastrado → `409`.

### 13.3 Excluir Fornecedor
- **Endpoint**: `DELETE /api/fornecedores/:id`
- **Regras**: fornecedor com compras registradas → `409` (o histórico de compras depende dele).

---

## 14. Compras e Entrada de Mercadorias (`/api/compras`)

Uma compra nasce **aberta** (pedido feito ao fornecedor) e não mexe no estoque. Ao ser **recebida**, a mercadoria entra no estoque e a despesa vai para o financeiro. Só compras abertas podem ser alteradas, recebidas ou canceladas (`409` nos demais casos).

### Formato da compra
```json
{
  "id": "cp249",
  "numero": 249,
  "fornecedorId": "f5",
  "fornecedor": "Vale Verde",
  "status": "recebida",
  "itens": [
    { "produtoId": "p5", "nome": "Feijão Carioca 1kg", "quantidade": 12, "custoUnitario": 6.50, "totalItem": 78.00 }
  ],
  "total": 78.00,
  "observacoes": "",
  "criadaEm": "2026-10-11T16:09:30Z",
  "criadaPor": "Administrador Nexora",
  "recebidaEm": "2026-10-11T16:09:45Z",
  "recebidaPor": "Administrador Nexora",
  "vencimento": "2026-11-08",
  "canceladaEm": null,
  "motivoCancelamento": null
}
```
`status`: `aberta`, `recebida` ou `cancelada`. `fornecedor` é o nome fantasia (ou a razão social) no momento da compra.

### 14.1 Listar Compras
- **Endpoint**: `GET /api/compras`
- **Query Params opcionais**: `dataInicio`, `dataFim` (pela data de criação; padrão: últimos 90 dias), `status` (→ senão `400`), `fornecedorId`, `busca` (fornecedor ou número). Com `status=aberta` o período é ignorado: todas as compras aguardando recebimento aparecem.
- **Response Body (`200 OK`)**: resumo, da mais recente para a mais antiga (`itens` = soma das quantidades).
```json
[
  { "id": "cp249", "numero": 249, "fornecedorId": "f5", "fornecedor": "Vale Verde", "status": "aberta", "itens": 12, "total": 78.00, "criadaEm": "2026-10-11T16:09:30Z", "recebidaEm": null, "vencimento": null }
]
```

### 14.2 Criar / Alterar Compra
- **Endpoints**: `POST /api/compras` (`201`) e `PUT /api/compras/:id` (`200`, só compras abertas); ambos devolvem a compra completa.
- **Request Body**:
```json
{
  "fornecedorId": "f5",
  "itens": [{ "produtoId": "p5", "quantidade": 12, "custoUnitario": 6.50 }],
  "observacoes": ""
}
```
- **Regras** (`400`): fornecedor e produtos existentes; ao menos um item; sem produto repetido; `quantidade` inteira ≥ 1; `custoUnitario` > 0. O backend calcula `totalItem` e `total`.

### 14.3 Detalhe da Compra
- **Endpoint**: `GET /api/compras/:id` → a compra completa, ou `404`.

### 14.4 Receber Compra
- **Endpoint**: `POST /api/compras/:id/receber`
- **Request Body**: `{ "atualizarCusto": true }` (padrão `true`)
- **Efeitos** (na mesma transação):
  1. soma a `quantidade` de cada item ao estoque do produto (produto excluído → `409`, nada é aplicado)
  2. com `atualizarCusto`, o `custo` de cada produto passa a ser o `custoUnitario` da compra
  3. status `recebida`, com `recebidaEm`, `recebidaPor` e `vencimento` = data do recebimento + `prazoPagamentoDias` do fornecedor
  4. lança uma **saída** no financeiro: descrição `"Compra #<numero> - <fornecedor>"`, categoria `"Fornecedores"`, data do recebimento, `compraId` preenchido
- **Response Body (`200 OK`)**: a compra completa mais `alertasPreco` (não fica salvo), com os produtos cujo novo custo ficou acima do preço de venda:
```json
{
  "id": "cp249",
  "status": "recebida",
  "alertasPreco": [{ "produtoId": "p12", "nome": "Bolo de Chocolate fatia", "custo": 9.10, "preco": 8.50 }]
}
```

### 14.5 Cancelar Compra
- **Endpoint**: `POST /api/compras/:id/cancelar`
- **Request Body** (opcional): `{ "motivo": "Fornecedor sem estoque" }`
- **Response Body (`200 OK`)**: a compra com `status: "cancelada"`, `canceladaEm` e `motivoCancelamento`.

---

## 15. Auditoria (`/api/auditoria`)

O backend registra quem fez cada alteração. O front só lê.

### Ações auditadas
| Área (`entidade`) | Ações (`acao`) |
|---|---|
| `sessao` | `entrou` (login), `encerrou` (outras sessões) |
| `usuario` | `criou`, `atualizou` (inclui desativar e enviar redefinição de senha) |
| `produto`, `categoria`, `cliente`, `fornecedor` | `criou`, `atualizou`, `excluiu` |
| `estoque` | `movimentou` |
| `venda` | `registrou`, `cancelou` |
| `pedido` | `atualizou` (mudança de coluna no Kanban) |
| `transacao` | `criou` (lançamento manual) |
| `compra` | `criou`, `atualizou`, `recebeu`, `cancelou` |
| `caixa` | `abriu`, `movimentou` (sangria/suprimento), `fechou` |
| `configuracoes` | `atualizou` |

### 15.1 Listar Registros
- **Endpoint**: `GET /api/auditoria`
- **Query Params opcionais**: `dataInicio`, `dataFim` (padrão: últimos 7 dias), `usuarioId`, `entidade` (valor fora da tabela → `400`), `busca` (na descrição ou no nome do usuário)
- **Response Body (`200 OK`)**: do mais recente para o mais antigo (o backend pode limitar a quantidade; o servidor de demonstração devolve no máximo 1000).
```json
[
  {
    "id": "a512",
    "data": "2026-10-11T16:09:00Z",
    "usuarioId": "u1",
    "usuario": "Administrador Nexora",
    "acao": "cancelou",
    "entidade": "venda",
    "entidadeId": "v3142",
    "descricao": "Cancelou a venda #3142 de R$ 35,96: Teste e2e"
  }
]
```
`descricao` é um texto pronto para exibir; o front não interpreta seu conteúdo.

---

## 16. Validando o backend

Os testes em `src/api/contrato.test.js` verificam este contrato de ponta a ponta. Eles:
- validam as regras de produtos, categorias, estoque, clientes, caixa, vendas, cancelamento, pedidos, fornecedores, compras, usuários, financeiro, relatórios, configurações e auditoria;
- verificam as permissões de cada perfil (`403` para o operador nas rotas de gestão);
- conferem os efeitos de uma venda e de um cancelamento em todas as telas;
- verificam os códigos de erro e o campo `mensagem`.

Os testes criam os próprios registros (com nomes únicos) e os excluem no final. Mesmo assim, **use um banco de desenvolvimento ou de testes**, porque vendas e lançamentos de teste ficam no histórico.

```bash
# Contra o servidor de demonstração
npm test

# Contra o backend real
CONTRATO_API_URL=http://localhost:3000 \
CONTRATO_EMAIL=admin@empresa.com \
CONTRATO_SENHA=senha-do-usuario \
npm run test:contrato
```

- `CONTRATO_EMAIL` deve ser de um **administrador**. Se ele já tiver um caixa aberto, os testes usam esse caixa e pulam o fechamento.
- Para testar também as permissões do operador, informe um usuário com perfil `operador` em `CONTRATO_EMAIL_OPERADOR` e `CONTRATO_SENHA_OPERADOR`. Sem eles, esses testes são pulados.

Com o backend real, os testes também validam o login (`401` com senha errada) e o `GET /api/auth/me`.
