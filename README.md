# 📦 ProjectFront-ERP — Nexora ERP & PDV

Sistema completo de Gestão Empresarial (ERP) integrado com Ponto de Venda (PDV) e Kanban de Pedidos em tempo real. Desenvolvido com React, Vite e Tailwind CSS, consumindo uma API REST própria.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## 🎨 Paleta Visual (Dark Theme)

A interface utiliza um esquema de cores moderno de alto contraste para máxima legibilidade no dia a dia operacional:

- **Onyx (`#131515`)**: Fundo principal da aplicação.
- **Graphite (`#2B2C28`)**: Cards, modais e superfícies laterais.
- **Verdigris (`#339989`)**: Botões principais, ações ativas e destaque primário.
- **Pearl Aqua (`#7DE2D1`)**: Métricas, realces visuais, badges e hover.
- **Snow (`#FFFAFB`)**: Tipografia e textos com máxima legibilidade.

---

## ✨ Módulos e Funcionalidades

### 1. 🛒 Ponto de Venda (PDV / POS)
- **Frente de Caixa Rápida**: Busca instantânea de produtos por nome ou leitor de código de barras.
- **Filtro por Categorias**: Seleção dinâmica de categorias (Bebidas, Alimentos, Limpeza, etc.).
- **Carrinho Dinâmico**: Gestão de quantidades (limitadas ao estoque disponível), desconto percentual, cliente da venda e cancelamento.
- **Checkout Multimeios**: Pagamento via PIX, Cartão e Dinheiro (com cálculo automático de troco e bloqueio de valor insuficiente).
- **Venda integrada**: ao finalizar, baixa o estoque, cria o pedido no Kanban, lança a entrada no Financeiro e soma ao histórico do cliente.
- **Cupom de venda**: pré-visualização e impressão do cupom não fiscal (térmica 80mm, 58mm ou A4), com impressão automática opcional.
- **Atalhos de teclado**: `F2` busca, `F3` código de barras, `F4` finalizar venda, `Enter` confirma o pagamento e `Esc` fecha janelas.
- **Kanban de Pedidos Integrado**: Alternância com 1 clique para visão de pedidos em preparação.

### 2. 📋 Kanban de Pedidos
- Colunas visuais: **Pendente**, **Em Preparo** e **Finalizado**.
- Arraste de cards via Drag-and-Drop (`@hello-pangea/dnd`) ou botões de avanço rápido.
- Dados de cliente, total, itens, método de pagamento e hora do pedido.
- Atualização automática a cada 15 segundos (pedidos feitos em outros caixas aparecem sozinhos).

### 3. 🧾 Histórico de Vendas
- Filtros por período, status, forma de pagamento, cliente ou número da venda.
- Resumo do período (total vendido, quantidade, ticket médio e canceladas).
- Detalhe da venda com itens, pagamento e troco, reimpressão do cupom e **cancelamento com estorno** (devolve o estoque, lança a saída no financeiro e ajusta o total do cliente).

### 4. 📊 Dashboard Executivo
- KPIs calculados a partir das vendas: vendas de hoje, ticket médio, produtos em baixa e faturamento do mês.
- Gráficos de vendas dos últimos 7 dias e de vendas por categoria no mês (Recharts).
- Últimas vendas com acesso direto ao detalhe.

### 5. 📦 Produtos & Controle de Estoque
- Listagem com precificação, margem, custo e estoque disponível.
- Alertas visuais para produtos em nível crítico ou esgotados.
- Modal de cadastro e edição rápida de produtos, com validação de preço/custo e código de barras (gerado automaticamente se ficar vazio).
- Movimentação de estoque (entrada e saída/perda) e busca por nome ou SKU.

### 6. 👥 Gestão de Clientes
- Cadastro completo de clientes PF e PJ (Nome, CPF/CNPJ, Telefone, E-mail), com máscaras e validação.
- Total acumulado de compras e atalho **Ver compras** para o histórico do cliente.

### 7. 💰 Gestão Financeira
- Fluxo de caixa por período, com entradas (vendas do PDV) e saídas (fornecedores, custos fixos, estornos).
- Receitas, despesas e saldo do período, balanço dos últimos 6 meses e link de cada lançamento para a venda de origem.
- Lançamento manual de movimentações e exportação em CSV.

### 8. 📈 Relatórios & Análises
- Vendas por dia, por categoria, produtos mais vendidos e melhores clientes, todos no período escolhido.
- Exportação de cada relatório em CSV (compatível com Excel).

### 9. ⚙️ Configurações e navegação
- Dados da loja e mensagem do cupom, modelo de impressão, alertas e segurança, salvos no backend.
- **Busca global** (`Ctrl+K`): páginas, produtos, clientes e vendas pelo número, ignorando acentos.
- **Notificações** reais no sino: produtos sem estoque ou com estoque baixo e pedidos pendentes.

### 💾 Modo demonstração
Sem `VITE_API_URL`, um servidor de demonstração dentro do navegador (`src/api/demo/`) responde às mesmas rotas do contrato da API. Ele gera um histórico de cerca de 6 meses de vendas, despesas e pedidos a partir da data atual e salva tudo no `localStorage`. Para voltar aos dados iniciais, use **Configurações → Dados → Restaurar**.

---

## 🛠 Tecnologias Utilizadas

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Roteamento**: [React Router DOM v6](https://reactrouter.com/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) + Tailwind Animate
- **UI Components**: Primitivos acessíveis baseados em [Radix UI](https://www.radix-ui.com/)
- **Animações**: [Framer Motion](https://www.framer-motion.dev/)
- **Drag and Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Dados**: [TanStack Query](https://tanstack.com/query) sobre uma API REST própria via `fetch` (contrato em [`CONTRATO_API_BACKEND.md`](CONTRATO_API_BACKEND.md))
- **Testes**: [Vitest](https://vitest.dev/)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20.19+ ou 22.12+
- npm versão 10+

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/KayckRossi/ProjectFront-ERP.git
cd ProjectFront-ERP
```

2. Instale as dependências:
```bash
npm install
```

3. (Opcional) Conecte ao backend copiando `.env.example` para `.env.local` (veja [Conectando o backend](#-conectando-o-backend)):
```bash
cp .env.example .env.local
```
Sem configurar o backend o sistema roda em **modo demonstração**: login local (`admin@nexora.com` / `admin123`) e dados salvos no navegador.

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse no navegador:
```
http://localhost:5173
```

### Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento local com Vite.
- `npm run build`: Compila os arquivos de produção para a pasta `dist/`.
- `npm run preview`: Visualiza localmente o build de produção.
- `npm run lint`: Executa a verificação estática do ESLint.
- `npm run lint:fix`: Corrige automaticamente avisos e padrões de linting.
- `npm test`: Roda os testes (incluindo os testes de contrato contra o servidor de demonstração).
- `npm run test:watch`: Roda os testes em modo observação.
- `npm run test:contrato`: Roda os testes de contrato contra um backend real (veja abaixo).

---

## 🔌 Conectando o backend

O front segue o contrato em [`CONTRATO_API_BACKEND.md`](CONTRATO_API_BACKEND.md). Todas as chamadas passam por `src/api/http.js`, e cada recurso tem seus hooks em `src/api/*.js`.

| Variável | Para que serve |
|---|---|
| `VITE_API_URL` | URL do backend (ex.: `http://localhost:3000`). Vazia = modo demonstração. `/` = mesma origem do front. |
| `API_PROXY_TARGET` | Só para desenvolvimento/preview: com `VITE_API_URL=/`, o Vite encaminha `/api` para este endereço e evita CORS. |

Duas formas de ligar o backend em desenvolvimento:

```bash
# A) Chamando o backend direto (o backend precisa liberar CORS para http://localhost:5173)
VITE_API_URL=http://localhost:3000

# B) Pelo proxy do Vite (sem CORS)
VITE_API_URL=/
API_PROXY_TARGET=http://localhost:3000
```

Para conferir se o backend segue o contrato, rode os testes de contrato contra ele (use um banco de testes, pois eles criam vendas e lançamentos):

```bash
CONTRATO_API_URL=http://localhost:3000 CONTRATO_EMAIL=admin@empresa.com CONTRATO_SENHA=senha npm run test:contrato
```

Na dúvida sobre alguma regra de negócio, a implementação de referência está em `src/api/demo/dominio.js`.

Em produção (Vercel/Netlify), defina `VITE_API_URL` nas variáveis de ambiente do projeto antes do build.

---

## 📁 Estrutura de Diretórios

```
├── src/
│   ├── api/            # Cliente HTTP, autenticação, hooks por recurso e testes de contrato
│   │   └── demo/       # Servidor de demonstração (implementação de referência do contrato)
│   ├── components/     # Componentes de layout e reutilizáveis (Modal, Cupom, BuscaGlobal, KanbanPedidos...)
│   │   └── ui/         # Componentes primitivos (Radix UI / Shadcn)
│   ├── hooks/          # Hooks customizados (paginação, Esc para fechar, valor atrasado...)
│   ├── lib/            # Contextos (auth, tema), datas, dinheiro, máscaras, formatação e CSV
│   ├── pages/          # Telas completas (Dashboard, PDV, Vendas, Estoque, etc.)
│   ├── App.jsx         # Roteamento central e provedores
│   ├── index.css       # Estilos globais e tokens Tailwind
│   └── main.jsx        # Ponto de entrada React
├── CONTRATO_API_BACKEND.md
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 📄 Licença

Este projeto é de uso privado e de propriedade de **Kayck Rossi**.
