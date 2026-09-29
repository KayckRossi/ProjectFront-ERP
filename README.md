# 📦 ProjectFront-ERP — Nexora ERP & PDV

Sistema completo de Gestão Empresarial (ERP) integrado com Ponto de Venda (PDV) e Kanban de Pedidos em tempo real. Desenvolvido com React, Vite, Tailwind CSS e Base44.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Base44](https://img.shields.io/badge/Base44-SDK-339989?style=flat)

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
- **Carrinho Dinâmico**: Gestão de quantidades, descontos e cancelamento de itens.
- **Checkout Multimeios**: Pagamento via PIX, Cartão e Dinheiro (com cálculo automático de troco).
- **Kanban de Pedidos Integrado**: Alternância com 1 clique para visão de pedidos em preparação.

### 2. 📋 Kanban de Pedidos
- Colunas visuais: **Pendente**, **Em Preparo** e **Finalizado**.
- Arraste de cards via Drag-and-Drop (`@hello-pangea/dnd`) ou botões de avanço rápido.
- Dados de cliente, total, itens, método de pagamento e hora do pedido.

### 3. 📊 Dashboard Executivo
- KPIs com indicadores de faturamento diário, ticket médio, total de vendas e ticket geral.
- Gráficos interativos de evolução diária e distribuição de vendas por categoria (Recharts).
- Tabela de vendas recentes e ranking de principais produtos.

### 4. 📦 Produtos & Controle de Estoque
- Listagem com precificação, margem, custo e estoque disponível.
- Alertas visuais para produtos em nível crítico ou esgotados.
- Modal de cadastro e edição rápida de produtos.

### 5. 👥 Gestão de Clientes
- Cadastro completo de clientes PF e PJ (Nome, CPF/CNPJ, Telefone, E-mail).
- Histórico acumulado de compras e ticket individual por cliente.

### 6. 💰 Gestão Financeira
- Fluxo de caixa com discriminação de entradas (PDV) e saídas (fornecedores, custos fixos).
- Balanço mensal comparativo entre receitas e despesas.

### 7. 📈 Relatórios & Análises
- Relatórios consolidados de vendas por período, curva ABC de produtos e clientes mais recorrentes.

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
- **Backend / SDK**: [Base44 SDK](https://docs.base44.com/)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js versão 20+
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

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

### Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento local com Vite.
- `npm run build`: Compila os arquivos de produção para a pasta `dist/`.
- `npm run preview`: Visualiza localmente o build de produção.
- `npm run lint`: Executa a verificação estática do ESLint.
- `npm run lint:fix`: Corrige automaticamente avisos e padrões de linting.

---

## 📁 Estrutura de Diretórios

```
├── src/
│   ├── api/            # Configurações do SDK Base44 e Query Client
│   ├── components/     # Componentes estruturais (Sidebar, Header, Layout, OrderKanban)
│   │   └── ui/         # Componentes primitivos (Radix UI / Shadcn)
│   ├── hooks/          # Hooks customizados (useIsMobile, useSize)
│   ├── lib/            # Helpers de autenticação, formatação e mockData
│   ├── pages/          # Telas completas (Dashboard, POS, Estoque, etc.)
│   ├── utils/          # Funções utilitárias
│   ├── App.jsx         # Roteamento central e provedores
│   ├── index.css       # Estilos globais e tokens Tailwind
│   └── main.jsx        # Ponto de entrada React
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 📄 Licença

Este projeto é de uso privado e de propriedade de **Kayck Rossi**.
