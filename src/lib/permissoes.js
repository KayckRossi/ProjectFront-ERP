// Perfis de acesso e permissões (CONTRATO_API_BACKEND.md, seção "Perfis e permissões").
// O front usa esta tabela para montar o menu e proteger as telas; o backend deve aplicar as
// mesmas regras e responder 403 quando o perfil não tiver a permissão.
// Usa apenas imports relativos para rodar também no servidor de demonstração e nos testes.

export const PERFIS = {
  admin: 'Administrador',
  gerente: 'Gerente',
  operador: 'Operador de caixa',
};

const TODOS = ['admin', 'gerente', 'operador'];
const GESTAO = ['admin', 'gerente'];
const ADMIN = ['admin'];

export const PERMISSOES = {
  'dashboard.ver': { descricao: 'Ver o dashboard', perfis: GESTAO },
  'pdv.operar': { descricao: 'Vender no PDV, operar o próprio caixa e o Kanban de pedidos', perfis: TODOS },
  'vendas.ver': { descricao: 'Consultar o histórico de vendas', perfis: TODOS },
  'vendas.cancelar': { descricao: 'Cancelar vendas', perfis: GESTAO },
  'clientes.gerenciar': { descricao: 'Cadastrar e editar clientes', perfis: TODOS },
  'clientes.excluir': { descricao: 'Excluir clientes', perfis: GESTAO },
  'produtos.gerenciar': { descricao: 'Cadastrar, editar e excluir produtos', perfis: GESTAO },
  'categorias.gerenciar': { descricao: 'Gerenciar categorias de produtos', perfis: GESTAO },
  'estoque.gerenciar': { descricao: 'Movimentar o estoque', perfis: GESTAO },
  'financeiro.ver': { descricao: 'Ver e lançar movimentações financeiras', perfis: GESTAO },
  'relatorios.ver': { descricao: 'Ver relatórios', perfis: GESTAO },
  'fornecedores.gerenciar': { descricao: 'Gerenciar fornecedores', perfis: GESTAO },
  'compras.gerenciar': { descricao: 'Criar, receber e cancelar compras', perfis: GESTAO },
  'caixa.ver-todos': { descricao: 'Ver o histórico de todos os caixas', perfis: GESTAO },
  'usuarios.gerenciar': { descricao: 'Gerenciar usuários e perfis', perfis: ADMIN },
  'auditoria.ver': { descricao: 'Ver a auditoria do sistema', perfis: ADMIN },
  'configuracoes.gerenciar': { descricao: 'Alterar as configurações da loja', perfis: ADMIN },
};

export const pode = (role, permissao) => Boolean(PERMISSOES[permissao]?.perfis.includes(role));
