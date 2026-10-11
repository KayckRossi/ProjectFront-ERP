// Regras de negócio do Nexora, escritas como implementação de referência do CONTRATO_API_BACKEND.md.
// O servidor de demonstração e os testes de contrato usam estes módulos; o backend real deve se comportar igual.
// Usam apenas imports relativos para rodar também fora do Vite (Node puro e testes).
export { ErroApi, LIMITE_PERIODO_DIAS } from './base.js';
export * from './catalogo.js';
export * from './clientes.js';
export * from './financeiro.js';
export * from './caixa.js';
export * from './vendas.js';
export * from './compras.js';
export * from './usuarios.js';
export * from './auditoria.js';
export * from './relatorios.js';
export * from './configuracoes.js';
