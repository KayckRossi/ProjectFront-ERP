# Contrato da API — nexo365 ERP & PDV

Este documento descreve o que o front (`ProjectFront-ERP`) espera do backend. O servidor de demonstração em `src/api/demo.ts` implementa exatamente estas rotas e serve de referência executável; `npm run test:contrato` confere um backend real contra ele (veja o fim do documento).

## 1. Convenções

- **Base:** todas as rotas começam com `/api`. O front chama `{VITE_API_URL}/api/...`.
- **Formato:** JSON (`Content-Type: application/json`), UTF-8. Campos em **camelCase**, como nos tipos de `src/types/index.ts`.
- **Datas:** strings ISO 8601 (`2026-10-18T14:30:00.000Z`). Campos que terminam em `At` ou `Date` são convertidos para `Date` no front.
- **Ids:** string, gerada pelo backend. No `POST` o front **não** envia `id`; no `PUT` o id vai só na URL.
- **Dinheiro:** número em reais com até 2 casas (`35.96`).
- **Respostas:**
  - `GET` lista → `200` com um array (sem envelope, sem paginação por enquanto).
  - `GET /:id`, `POST`, `PUT` → `200`/`201` com o registro completo, já com `id` e `createdAt`.
  - `DELETE` → `204` sem corpo (ou `200`).
- **Erros:** status HTTP adequado e corpo `{ "message": "texto para o usuário" }`. O front mostra `message` num aviso.
  - `400`/`422` validação · `401` não autenticado/token inválido · `403` sem permissão · `404` não encontrado · `409` conflito (ex.: código de barras repetido).

## 2. Autenticação

Token **Bearer** (JWT ou opaco). O front guarda o token no navegador e envia em todas as rotas, exceto o login:

```
Authorization: Bearer <token>
```

Qualquer `401` faz o front apagar o token e voltar para a tela de login.

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/auth/login` | `{ "email": string, "password": string }` | `200 { "access_token": string, "user": User }` · `401` credenciais inválidas |
| GET | `/api/auth/me` | — | `200 User` (usuário do token) |
| POST | `/api/auth/logout` | — | `204` (opcional: invalidar o token) |

`User` nunca deve incluir a senha.

## 3. Recursos (CRUD)

Todos seguem o mesmo padrão:

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/<recurso>` | lista |
| GET | `/api/<recurso>/:id` | um registro |
| POST | `/api/<recurso>` | cria (corpo sem `id`) |
| PUT | `/api/<recurso>/:id` | substitui (corpo sem `id`) |
| DELETE | `/api/<recurso>/:id` | remove |

### 3.1 `produtos` — `Product`
| Campo | Tipo | Observação |
|---|---|---|
| id | string | |
| code | string | código interno (único) |
| barcode | string | EAN (único) |
| name | string | obrigatório |
| description | string | |
| category | string | um dos valores de `/api/categorias` |
| price | number | preço de venda |
| cost | number | custo |
| stock | number | quantidade em estoque |
| minStock | number | estoque mínimo (alerta de "estoque baixo" quando `stock <= minStock`) |
| unit | string | `UN`, `KG`, `CX`... |
| supplierId | string | id de `fornecedores` |
| active | boolean | |
| createdAt / updatedAt | data | |

Telas: Produtos, Estoque (ajuste de quantidade via `PUT`), PDV, Códigos de Barras, Dashboard, Relatórios.

### 3.2 `clientes` — `Customer`
`id, name, document (CPF/CNPJ), email, phone, address, city, state, zipCode, notes, active, createdAt`.

### 3.3 `fornecedores` — `Supplier`
`id, name, document (CNPJ), contact, email, phone, address, city, state, active, createdAt`.

### 3.4 `vendedores` — `Seller`
`id, name, document, email, phone, commissionRate (percentual, ex.: 5 = 5%), active, createdAt`.

### 3.5 `vendas` — `Sale`
| Campo | Tipo | Observação |
|---|---|---|
| id | string | |
| items | `CartItem[]` | `{ product: Product, quantity: number, discount: number, subtotal: number }` |
| customerId | string? | |
| sellerId | string? | |
| subtotal | number | soma dos `items[].subtotal` |
| discount | number | desconto em reais |
| total | number | `subtotal - discount` |
| paymentMethod | string | um dos valores de `/api/formas-pagamento` |
| status | `pending` \| `completed` \| `cancelled` | o PDV envia `completed` |
| createdAt | data | definido pelo backend |

**Regras no `POST /api/vendas`:**
- Recalcular `subtotal`/`total` no servidor (não confiar no front) e rejeitar (`422`) total negativo.
- Baixar o estoque de cada produto vendido (`stock -= quantity`). O front recarrega produtos e vendas depois de vender.
- Recomendado: rejeitar com `409` se não houver estoque suficiente.

Telas: PDV (cria), Recibos (lista `completed`), Dashboard e Relatórios.

### 3.6 `contas-receber` e `contas-pagar` — `Account`
| Campo | Tipo | Observação |
|---|---|---|
| id | string | |
| type | `receivable` \| `payable` | `receivable` em contas-receber, `payable` em contas-pagar |
| description | string | |
| value | number | |
| dueDate | data | vencimento |
| paidDate | data? | preenchido quando pago |
| status | `pending` \| `paid` \| `overdue` | |
| customerId | string? | contas a receber |
| supplierId | string? | contas a pagar |
| createdAt | data | |

Baixar/estornar uma conta é um `PUT` com `status` e `paidDate`. Recomendado: o backend marcar `overdue` quando `dueDate` passou e a conta não foi paga.

### 3.7 `usuarios` — `User`
| Campo | Tipo | Observação |
|---|---|---|
| id | string | |
| name | string | |
| email | string | único; usado no login |
| role | `admin` \| `manager` \| `seller` \| `cashier` | |
| permissions | string[] | ex.: `["all"]`, `["sales","stock","reports","customers"]` |
| active | boolean | usuário inativo não consegue entrar |
| createdAt | data | |

A tela de usuários ainda não tem campo de senha: defina a senha inicial no backend (ou por e-mail de convite). Recomendado: apenas `admin` gerencia usuários (`403` para os demais).

## 4. Listas auxiliares

| Método | Rota | Resposta |
|---|---|---|
| GET | `/api/categorias` | `string[]` — ex.: `["Bebidas","Alimentos","Higiene","Limpeza","Outros"]` |
| GET | `/api/formas-pagamento` | `string[]` — ex.: `["Dinheiro","Cartão Débito","Cartão Crédito","PIX","Fiado"]` |

## 5. CORS e endereço

O front roda em outra origem (ex.: `https://xxxx.ngrok-free.app`), então o backend precisa:

- responder ao preflight `OPTIONS` e liberar `Access-Control-Allow-Origin` para a origem do front;
- liberar os cabeçalhos `Authorization`, `Content-Type` e `ngrok-skip-browser-warning` e os métodos `GET, POST, PUT, PATCH, DELETE`.

Não há cookies: não é preciso `Allow-Credentials`.

Se o backend estiver atrás do ngrok (plano grátis), o ngrok responde com uma página de aviso em HTML em vez do JSON. Para evitar isso, o front envia `ngrok-skip-browser-warning: 1` sempre que o endereço da API for do ngrok — por isso esse cabeçalho precisa estar liberado no CORS.

**Apontar o front para o backend sem rebuild:** abra o front com `?api=https://endereco-do-backend` (ex.: `https://xxxx.ngrok-free.app/login?api=https://minha-api.ngrok-free.app`). O endereço fica salvo no navegador; `?api=demo` volta para o modo demonstração.

## 6. Conferir o backend contra o contrato

```bash
CONTRATO_API_URL=https://minha-api CONTRATO_EMAIL=admin@empresa.com CONTRATO_SENHA=senha npm run test:contrato
```

Sem `CONTRATO_API_URL` os mesmos testes rodam contra o servidor de demonstração. Use um banco de testes: os testes criam e apagam registros.
