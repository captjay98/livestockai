# LivestockAI

<p align="center">
  <img src="../../public/logo-icon.png" alt="Logo LivestockAI" width="120" />
</p>

<p align="center">
  <strong>Gestão de pecuária offline-first, suportando 6 tipos de animais.</strong>
</p>

<p align="center">
  <a href="#funcionalidades">Funcionalidades</a> •
  <a href="#início-rápido">Início Rápido</a> •
  <a href="#implantação">Implantação</a> •
  <a href="#para-agentes-ia">Para Agentes IA</a> •
  <a href="#contribuindo">Contribuindo</a>
</p>

<p align="center">
  🌍 <strong>Idiomas:</strong>
  <a href="../../README.md">English</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.sw.md">Kiswahili</a> •
  <a href="README.es.md">Español</a> •
  <a href="README.tr.md">Türkçe</a> •
  <a href="README.hi.md">हिन्दी</a>
</p>

---

## Funcionalidades

### 🐔 Gestão Multi-Espécies

- **Suporte modular a espécies** — Aves (frangos de corte, poedeiras, perus, patos), Aquicultura (bagre, tilápia), com arquitetura extensível para Gado, Cabras, Ovelhas e Abelhas.
- **Rastreamento de ciclo de vida de lotes** — Da aquisição à venda com gestão de status (ativo, esgotado, vendido).
- **Métricas específicas por espécie** — Tipos de ração, padrões de crescimento e tipos de estrutura por espécie.
- **Suporte multi-fazenda** — Gerencie várias fazendas de uma única conta com filtragem por fazenda.

### 📊 Análise Preditiva & Monitoramento de Saúde

- **Previsão de crescimento** — Preveja datas de colheita e pesos alvo usando curvas de crescimento específicas.
- **Projeções de receita** — Estime lucros com base em amostras de peso atuais e preços de mercado.
- **Amostragem de peso** — Acompanhe pesos médios, mínimos e máximos com tamanhos de amostra.
- **Alertas de mortalidade** — Avisos automáticos quando os lotes excedem os limites normais de mortalidade.
- **Rastreamento de mortalidade** — Registre mortes por causa (doença, predador, clima, desconhecido) com análise de taxas.
- **Cronogramas de vacinação** — Acompanhe vacinações com lembretes de datas de vencimento.
- **Qualidade da água** (Aquicultura) — Monitore pH, temperatura, oxigênio dissolvido, níveis de amônia.

### 💰 Gestão Financeira

- **Rastreamento de vendas** — Registre vendas por quantidade, peso ou unidade com vínculo ao cliente.
- **Gestão de despesas** — Despesas categorizadas (ração, remédios, equipamentos, mão de obra, serviços públicos, etc.).
- **Faturamento** — Gere faturas de clientes com itens de linha e rastreamento de status de pagamento.
- **Relatórios de Lucros/Perdas** — Análise de P&L baseada em período com detalhamento de receitas e despesas.
- **Mais de 20 predefinições de moeda** — Suporte internacional (USD, EUR, GBP, NGN, KES, ZAR, INR, etc.).

### 📦 Estoque & Ração

- **Estoque de ração** — Acompanhe níveis de estoque com alertas de limite baixo.
- **Estoque de medicamentos** — Monitore quantidades com rastreamento de data de validade.
- **Consumo de ração** — Registre alimentação diária por lote com rastreamento de custos.
- **Análise de conversão alimentar** — Calcule índices de eficiência (CA).

### 👥 CRM & Contatos

- **Gestão de clientes** — Acompanhe compradores com informações de contato e histórico de compras.
- **Gestão de fornecedores** — Gerencie incubatórios, fábricas de ração, farmácias, fornecedores de equipamentos.
- **Tipos de clientes** — Classificação: Individual, restaurante, varejista, atacadista.

### 📱 Progressive Web App (PWA)

- **Offline-first** — Funcionalidade completa sem internet; sincroniza quando reconectado.
- **Instalável** — Adicione à tela inicial no celular e desktop.
- **Atualizações automáticas** — O service worker lida com atualizações do aplicativo perfeitamente.

### 🌍 Internacionalização

- **Moeda configurável** — Símbolo, decimais, posição, separadores.
- **Formatos de data** — MM/DD/AAAA, DD/MM/AAAA, AAAA-MM-DD.
- **Unidades** — Peso (kg/lbs), área (m²/sqft), temperatura (°C/°F).
- **Formatos de hora** — Relógio de 12 horas ou 24 horas.

### 📋 Relatórios & Auditoria

- **5 tipos de relatórios** — Lucros/Perdas, Estoque, Vendas, Ração, Ovos.
- **Filtragem por intervalo de datas** — Análise de período personalizada.
- **Capacidade de exportação** — Baixe relatórios para uso externo.
- **Logs de auditoria** — Histórico completo de atividades com rastreamento de usuário, ação, entidade.

### 🔐 Segurança & Auth

- **Better Auth** — Autenticação segura baseada em sessão.
- **Acesso baseado em funções** — Papéis de administrador e equipe.
- **Rotas protegidas** — Todos os dados da fazenda protegidos por autenticação.

---

## Capturas de Tela

<!-- TODO: Add screenshots -->

| Painel de Controle                                         | Gestão de Lotes                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| ![Painel](../../screenshots/dashboard.png)                 | ![Lotes](../../screenshots/batches.png)                     |
| _Visão geral da fazenda com KPIs, alertas e ações rápidas_ | _Lista de lotes com status, espécie e taxas de mortalidade_ |

| Detalhe do Lote                                          | Relatórios Financeiros                                  |
| -------------------------------------------------------- | ------------------------------------------------------- |
| ![Detalhe do Lote](../../screenshots/batch-detail.png)   | ![Relatórios](../../screenshots/reports.png)            |
| _Gráfico de crescimento, projeções e cronograma do lote_ | _Análise de Lucros/Perdas com detalhamento de despesas_ |

| Visualização Móvel                     | Modo Offline                              |
| -------------------------------------- | ----------------------------------------- |
| ![Móvel](../../screenshots/mobile.png) | ![Offline](../../screenshots/offline.png) |
| _Design responsivo para uso em campo_  | _Funciona sem conexão com a internet_     |

| Configurações                                    | Faturas                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| ![Configurações](../../screenshots/settings.png) | ![Faturas](../../screenshots/invoices.png)             |
| _Preferências de moeda, data e unidades_         | _Faturamento de cliente com rastreamento de pagamento_ |

## Stack Tecnológico

| Camada         | Tecnologia                                                            |
| -------------- | --------------------------------------------------------------------- |
| Framework      | [TanStack Start](https://tanstack.com/start) (React 19, SSR)          |
| Banco de Dados | PostgreSQL via [Neon](https://neon.tech) (serverless)                 |
| ORM            | [Kysely](https://kysely.dev) (SQL tipado)                             |
| Estilo         | [Tailwind CSS v4](https://tailwindcss.com)                            |
| Estado         | [TanStack Query](https://tanstack.com/query) + Persistência IndexedDB |
| Implantação    | [Cloudflare Workers](https://workers.cloudflare.com)                  |

---

## Início Rápido

### Pré-requisitos

- **Node.js 22+** (ou Bun 1.0+)
- **Conta Neon** — Grátis em [neon.tech](https://neon.tech) (configuração do banco de dados automatizada)

### 1. Clonar & Instalar

```bash
git clone https://github.com/yourusername/livestock-ai.git
cd livestock-ai
bun install
```

### 2. Configuração Automatizada

```bash
kiro-cli
@quickstart  # Assistente de configuração interativo
```

O assistente de início rápido irá:

- ✅ Verificar seu ambiente (Node, Bun)
- ✅ Criar seu banco de dados automaticamente via Neon MCP
- ✅ Configurar variáveis de ambiente
- ✅ Executar migrações e dados de demonstração
- ✅ Iniciar o servidor de desenvolvimento

### 3. Começar a Desenvolver

```bash
bun dev  # Se não iniciado automaticamente
```

Abra [http://localhost:3001](http://localhost:3001)

### Credenciais de Login Padrão

Após executar o seeder, você pode fazer login com estas contas padrão:

#### Seeder de Produção (`bun run db:seed`)

| Função | Email                     | Senha         |
| ------ | ------------------------- | ------------- |
| Admin  | `admin@livestockai.local` | `password123` |

#### Seeder de Desenvolvimento (`bun run db:seed:dev`)

| Função | Email                     | Senha         |
| ------ | ------------------------- | ------------- |
| Admin  | `admin@livestockai.local` | `password123` |
| Demo   | `demo@livestockai.local`  | `demo123`     |

**⚠️ Nota de Segurança**: Altere essas senhas padrão imediatamente em ambientes de produção. Você pode definir credenciais personalizadas via variáveis de ambiente:

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Seu Nome
```

### Configuração Manual (Alternativa)

Se você preferir configuração manual ou não tiver o Kiro CLI:

<details>
<summary>Clique para expandir instruções de configuração manual</summary>

#### Configurar Ambiente

```bash
cp .env.example .env
```

Edite `.env` com seus valores:

```env
# Database - Get a free Neon database at https://neon.tech
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

# Auth - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3001
```

#### Inicializar Banco de Dados

```bash
bun run db:migrate   # Executar migrações
bun run db:seed      # Seeder dados de produção (usuário admin + dados de referência)
```

Para desenvolvimento com dados de demonstração:

```bash
bun run db:seed:dev  # Seeder dados de demonstração completos
```

</details>

---

## Implantação

### Cloudflare Workers (Recomendado)

1. Instale o Wrangler CLI:

   ```bash
   bun add -g wrangler
   wrangler login
   ```

2. Defina seus segredos:

   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL
   ```

3. Implante:
   ```bash
   bun run deploy
   ```

### Outras Plataformas

O aplicativo pode ser implantado em qualquer plataforma que suporte Node.js:

- Vercel
- Railway
- Render
- Auto-hospedado com Docker

---

## Documentação

Guias completos para usuários, desenvolvedores e agentes IA:

| Documento                                          | Descrição                            | Público         |
| -------------------------------------------------- | ------------------------------------ | --------------- |
| **[../docs/INDEX.md](../docs/INDEX.md)**           | **Hub de documentação**              | Todos           |
| [../AGENTS.md](../AGENTS.md)                       | Guia de desenvolvimento de agente IA | Assistentes IA  |
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Arquitetura do sistema               | Desenvolvedores |
| [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)     | Implantação em produção              | DevOps          |
| [../docs/TESTING.md](../docs/TESTING.md)           | Estratégias de teste                 | Desenvolvedores |
| [../docs/DATABASE.md](../docs/DATABASE.md)         | Esquema de banco de dados & Kysely   | Desenvolvedores |
| [../docs/INTEGRATIONS.md](../docs/INTEGRATIONS.md) | Provedores SMS/Email                 | Desenvolvedores |
| [../DEVLOG.md](../DEVLOG.md)                       | Cronograma de desenvolvimento        | Todos           |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)           | Guia de contribuição                 | Contribuidores  |

## Para Agentes IA

Este projeto foi projetado para ser amigável a agentes de IA. Veja estes recursos:

| Arquivo                                  | Objetivo                                           |
| ---------------------------------------- | -------------------------------------------------- |
| [../AGENTS.md](../AGENTS.md)             | Guia abrangente para assistentes de codificação IA |
| [../DEVLOG.md](../DEVLOG.md)             | Cronograma de desenvolvimento e decisões           |
| [../.kiro/README.md](../.kiro/README.md) | Guia de configuração Kiro CLI                      |

### Configuração Kiro CLI

O projeto inclui configuração abrangente do Kiro CLI:

**Início Rápido:**

```bash
kiro-cli
@quickstart  # Assistente de configuração interativo
```

**Agentes Disponíveis (7):**

```bash
kiro-cli --agent livestock-specialist  # Especialista em domínio
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, implantação
kiro-cli --agent data-analyst          # Análise, previsão
kiro-cli --agent qa-engineer           # Testes
kiro-cli --agent security-engineer     # Auth, segurança
```

Veja [../.kiro/README.md](../.kiro/README.md) para documentação completa.

---

## Estrutura do Projeto

```
├── app/
│   ├── components/     # Componentes de UI reutilizáveis
│   ├── lib/            # Lógica de negócios & utilitários
│   │   ├── auth/       # Autenticação (Better Auth)
│   │   ├── batches/    # Gestão de lotes
│   │   ├── db/         # Banco de dados (Kysely + migrações)
│   │   ├── finance/    # Cálculos financeiros
│   │   └── ...         # Outros módulos de domínio
│   └── routes/         # Páginas TanStack Router
├── public/             # Ativos estáticos
├── .kiro/              # Configuração de agente IA
│   ├── settings/       # Configs MCP
│   ├── steering/       # Diretrizes de codificação
│   └── specs/          # Especificações de recursos
└── ...
```

---

## Scripts

| Comando               | Descrição                               |
| --------------------- | --------------------------------------- |
| `bun dev`             | Iniciar servidor de desenvolvimento     |
| `bun build`           | Compilar para produção                  |
| `bun run test`        | Executar testes                         |
| `bun run lint`        | Executar ESLint                         |
| `bun run check`       | Formatar + lint                         |
| `bun run db:migrate`  | Executar migrações de banco de dados    |
| `bun run db:seed`     | Seeder dados de produção (admin + refs) |
| `bun run db:seed:dev` | Seeder dados de demonstração completos  |
| `bun run db:rollback` | Reverter última migração                |
| `bun run deploy`      | Compilar & implantar no Cloudflare      |

---

## Contribuindo

Nós acolhemos contribuições! Por favor, veja [../CONTRIBUTING.md](../CONTRIBUTING.md) para:

- Fluxo de trabalho de desenvolvimento
- Convenções de commit
- Diretrizes de pull request

---

## Licença

Licença MIT — veja [../LICENSE](../LICENSE) para mais detalhes.

---

<p align="center">
  Feito com ❤️ para agricultores em todos os lugares
</p>
