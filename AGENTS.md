# AGENTS.md

## Project Context

Nexora ERP & PDV — front-end em React + Vite + Tailwind. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions (código e textos em português).

Start with `README.md` for local setup and environment variables.

## Key Files

- `src/`: frontend application source.
- `CONTRATO_API_BACKEND.md`: contrato REST que o backend deve implementar.
- `src/api/http.js`: cliente HTTP (`VITE_API_URL`, token Bearer, aviso de sessão expirada). Sem `VITE_API_URL`, encaminha as chamadas para o servidor de demonstração.
- `src/api/*.js`: hooks do TanStack Query por recurso (produtos, vendas, financeiro...). As telas não chamam `fetch` diretamente.
- `src/api/demo/`: servidor de demonstração; `dominio.js` é a implementação de referência das regras do contrato e `seed.js` gera os dados de exemplo.
- `src/api/contrato.test.js`: testes do contrato (rodam contra o servidor de demonstração ou contra o backend real).
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- `npm run dev` inicia o front-end; sem backend configurado o app roda em modo demonstração.
- Ao mudar o contrato da API, atualize juntos `CONTRATO_API_BACKEND.md`, `src/api/demo/dominio.js` e `src/api/contrato.test.js`.
- `src/lib/datas.js`, `dinheiro.js`, `texto.js`, `mascaras.js` e `estoque.js` usam só imports relativos, porque também rodam no servidor de demonstração e nos testes em Node.
- Run `npm run lint`, `npm test` and `npm run build` before finishing code changes.
