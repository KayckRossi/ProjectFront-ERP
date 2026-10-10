# AGENTS.md

## Project Context

Nexora ERP & PDV — front-end em React + Vite + Tailwind. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions (código e textos em português).

Start with `README.md` for local setup and environment variables.

## Key Files

- `src/`: frontend application source.
- `src/api/http.js`: cliente HTTP do backend próprio (`VITE_API_URL`, token Bearer).
- `src/api/auth.js`: autenticação; sem `VITE_API_URL` usa o modo demonstração local.
- `src/lib/ErpDataContext.jsx`: dados compartilhados entre as telas (hoje persistidos no localStorage).
- `CONTRATO_API_BACKEND.md`: contrato REST que o backend deve implementar.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- `npm run dev` inicia o front-end; sem backend configurado o app roda em modo demonstração.
- Novas chamadas ao backend devem passar por `src/api/http.js` e seguir o contrato.
- Run `npm run lint` and `npm run build` before finishing code changes.
