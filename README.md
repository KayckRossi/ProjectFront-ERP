# nexo365 — ERP & PDV (front-end)

Front-end do **nexo365** (Nuvex Tecnologia): PDV, produtos, estoque, clientes, fornecedores, vendedores, contas a pagar e a receber, recibos, códigos de barras, relatórios e usuários. O painel administrativo fica no [nexora-backoffice](https://github.com/KayckRossi/nexora-backoffice).

Stack: Vite 5 · React 18 · TypeScript · Tailwind · shadcn/ui · TanStack Query · react-router 6 · Vitest.

## Como rodar

Pré-requisito: Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:8080
```

Sem backend configurado o app abre em **modo demonstração**: um servidor dentro do navegador (`src/api/demo.ts`) responde às rotas da API com dados de exemplo, e qualquer e-mail e senha entram. Os dados ficam no navegador (`localStorage`).

### Scripts
| Script | O que faz |
|---|---|
| `npm run dev` | desenvolvimento (porta 8080) |
| `npm run build` / `npm run preview` | build de produção e servidor local dele (porta 4173) |
| `npm run lint` | ESLint |
| `npm test` | testes unitários e de contrato (contra o modo demonstração) |
| `npm run test:contrato` | testes de contrato contra um backend real (veja abaixo) |

## Backend

O contrato completo (rotas, campos, regras, erros e CORS) está em **[CONTRATO_API_BACKEND.md](CONTRATO_API_BACKEND.md)**.

Arquitetura do front:

```
telas (src/pages)
  └─ hooks do React Query (src/api/recursos.ts: useLista, useColecao, useRegistrarVenda...)
       └─ cliente HTTP único (src/lib/http.ts: endereço da API, token Bearer, erros, datas)
            ├─ backend real  ({VITE_API_URL}/api/...)
            └─ modo demonstração (src/api/demo.ts), quando não há endereço
```

- **Autenticação** (`src/lib/auth.ts`): `POST /api/auth/login` devolve o token, guardado no navegador ("Manter conectado" usa `localStorage`; sem ele, `sessionStorage`). Todas as rotas, menos `/login`, exigem token (`src/components/RotaProtegida.tsx`); qualquer `401` volta para o login.
- **Gravações:** `useColecao` funciona como um `useState` — a tela altera a lista como sempre e cada diferença vira `POST`, `PUT` ou `DELETE` no backend; depois a lista é recarregada do servidor. A venda do PDV é um `POST /api/vendas` (o backend baixa o estoque).

### Apontar para o backend

1. **No build:** copie `.env.example` para `.env.local` e defina `VITE_API_URL=https://endereco-do-backend`.
2. **Sem rebuild (útil com ngrok):** abra o front com `?api=https://endereco-do-backend`, por exemplo `https://xxxx.ngrok-free.app/login?api=https://minha-api.ngrok-free.app`. O endereço fica salvo no navegador e aparece na tela de login. `?api=demo` volta para o modo demonstração.
3. **Sem CORS em desenvolvimento:** `VITE_API_URL=/` e `API_PROXY_TARGET=http://localhost:3000` — o Vite repassa `/api` para o backend.

### Conferir o backend contra o contrato

```bash
CONTRATO_API_URL=http://localhost:3000 CONTRATO_EMAIL=admin@empresa.com CONTRATO_SENHA=senha npm run test:contrato
```

Use um banco de testes: os testes criam e apagam registros.

## Acesso por ngrok

O `vite.config.ts` já aceita os domínios do ngrok no `dev` e no `preview`:

```bash
npm run build && npm run preview     # porta 4173
ngrok http 4173
```

No plano grátis o ngrok mostra uma página de aviso na primeira visita ("Visit Site").

## Estrutura

```
src/
├── api/          recursos REST + hooks (recursos.ts), servidor de demonstração (demo.ts), testes de contrato
├── components/   layout (Sidebar, MainLayout), RotaProtegida e componentes shadcn/ui
├── data/         dados de exemplo usados pelo modo demonstração
├── lib/          cliente HTTP, autenticação e utilitários
├── pages/        telas
└── types/        tipos compartilhados com o contrato da API
```
