# AGENTS.md

## Project Context

Nexora ERP & PDV — front-end em React + Vite + Tailwind. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions (código e textos em português).

Start with `README.md` for local setup and environment variables.

As telas de backoffice (caixas, compras, fornecedores, categorias, usuários, auditoria) ficam em outro repositório, `KayckRossi/nexora-backoffice`, que usa a mesma API e tem uma cópia de `src/api/demo/`, `src/lib/permissoes.js` e `src/api/contrato.test.js`. Este repositório é a fonte da verdade do contrato.

## Key Files

- `src/`: frontend application source.
- `CONTRATO_API_BACKEND.md`: contrato REST que o backend deve implementar.
- `src/api/http.js`: cliente HTTP (`VITE_API_URL`, token Bearer, aviso de sessão expirada). Sem `VITE_API_URL`, encaminha as chamadas para o servidor de demonstração.
- `src/api/*.js`: hooks do TanStack Query por recurso (produtos, vendas, financeiro...). As telas não chamam `fetch` diretamente.
- `src/api/demo/`: servidor de demonstração; `dominio/` é a implementação de referência das regras do contrato (um arquivo por módulo), `servidor.js` mapeia rotas e permissões e `seed.js` gera os dados de exemplo.
- `src/lib/permissoes.js`: perfis (`admin`, `gerente`, `operador`) e permissões, usados pelo menu/rotas do front e pelo servidor de demonstração.
- `src/api/contrato.test.js`: testes do contrato (rodam contra o servidor de demonstração ou contra o backend real).
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- `npm run dev` inicia o front-end; sem backend configurado o app roda em modo demonstração.
- Ao mudar o contrato da API, atualize juntos `CONTRATO_API_BACKEND.md`, `src/api/demo/dominio/` (e a rota em `servidor.js`) e `src/api/contrato.test.js`, e copie as mudanças para o nexora-backoffice.
- Telas novas: registre a rota em `ROTAS_INTERNAS` (`src/App.jsx`) com a permissão, e o item no `Sidebar` e na `BuscaGlobal`.
- `src/lib/datas.js`, `dinheiro.js`, `texto.js`, `mascaras.js`, `estoque.js` e `permissoes.js` usam só imports relativos, porque também rodam no servidor de demonstração e nos testes em Node.
- Run `npm run lint`, `npm test` and `npm run build` before finishing code changes.
