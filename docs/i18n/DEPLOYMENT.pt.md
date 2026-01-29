# Guia de Implantação

Guia completo para implantar o LivestockAI em produção.

---

## Pré-requisitos

- **Conta Cloudflare** (o nível gratuito funciona)
- **Conta Neon** (o nível gratuito funciona)
- **Conta GitHub** (para CI/CD)
- **Node.js 22+** ou **Bun 1.0+**

---

## Início Rápido (5 minutos)

```bash
# 1. Clonar e instalar
git clone https://github.com/yourusername/livestockai.git
cd livestockai
bun install

# 2. Configurar banco de dados
bun run db:migrate
bun run db:seed

# 3. Implantar
bun run deploy
```

---

## Passo 1: Configuração do Banco de Dados (Neon)

### Criar Projeto Neon

1. Vá para [console.neon.tech](https://console.neon.tech)
2. Clique em **New Project**
3. Escolha a região mais próxima de seus usuários
4. Copie a string de conexão

### Configurar Banco de Dados

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Executar Migrações

```bash
# Criar tabelas
bun run db:migrate

# Inserir dados iniciais (usuário admin + dados de referência)
bun run db:seed

# Opcional: Inserir dados de demonstração para testes
bun run db:seed:dev
```

### Verificar Banco de Dados

```bash
# Verificar se as tabelas existem
bun run db:status

# Ou usar o Editor SQL Neon
# Executar: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Passo 2: Configuração do Cloudflare Workers

### Instalar Wrangler CLI

```bash
npm install -g wrangler
# ou
bun add -g wrangler
```

### Login no Cloudflare

```bash
wrangler login
```

### Configurar Worker

Edite `wrangler.jsonc`:

```jsonc
{
  "name": "livestockai-production",
  "main": "./.output/server/index.mjs",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "NODE_ENV": "production",
  },
}
```

### Definir Segredos

```bash
# Conexão com banco de dados
wrangler secret put DATABASE_URL
# Cole sua string de conexão Neon

# Segredo Better Auth (gerar com: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Opcional: Provedor SMS (Termii)
wrangler secret put TERMII_API_KEY

# Opcional: Provedor Email (Resend)
wrangler secret put RESEND_API_KEY
```

---

## Passo 3: Compilar & Implantar

### Compilar para Produção

```bash
bun run build
```

Isso cria um pacote otimizado em `.output/`.

### Implantar no Cloudflare

```bash
bun run deploy
# ou
wrangler deploy
```

### Verificar Implantação

```bash
# Verificar status da implantação
wrangler deployments list

# Ver logs
wrangler tail
```

Seu aplicativo agora está no ar em: `https://livestockai-production.your-subdomain.workers.dev`

---

## Passo 4: Domínio Personalizado (Opcional)

### Adicionar Domínio ao Cloudflare

1. Vá para o Painel Cloudflare → Workers & Pages
2. Selecione seu worker
3. Clique em **Triggers** → **Custom Domains**
4. Adicione seu domínio (ex: `app.suafazenda.com`)

### Atualizar DNS

O Cloudflare configura automaticamente os registros DNS.

---

## Variáveis de Ambiente

### Obrigatório

| Variável             | Descrição               | Exemplo                   |
| -------------------- | ----------------------- | ------------------------- |
| `DATABASE_URL`       | Conexão PostgreSQL Neon | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Segredo de sessão Auth  | `openssl rand -base64 32` |

### Opcional

| Variável              | Descrição           | Padrão    |
| --------------------- | ------------------- | --------- |
| `SMS_PROVIDER`        | Serviço SMS         | `console` |
| `EMAIL_PROVIDER`      | Serviço Email       | `console` |
| `TERMII_API_KEY`      | Chave API Termii    | -         |
| `TERMII_SENDER_ID`    | ID remetente Termii | -         |
| `TWILIO_ACCOUNT_SID`  | SID conta Twilio    | -         |
| `TWILIO_AUTH_TOKEN`   | Token auth Twilio   | -         |
| `TWILIO_PHONE_NUMBER` | Telefone Twilio     | -         |
| `RESEND_API_KEY`      | Chave API Resend    | -         |
| `SMTP_HOST`           | Servidor SMTP       | -         |
| `SMTP_PORT`           | Porta SMTP          | `587`     |
| `SMTP_USER`           | Usuário SMTP        | -         |
| `SMTP_PASSWORD`       | Senha SMTP          | -         |
| `SMTP_FROM`           | Email remetente     | -         |

---

## CI/CD com GitHub Actions

### Criar Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test

      - name: Build
        run: bun run build

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Adicionar Segredos ao GitHub

1. Vá para o repositório GitHub → Settings → Secrets
2. Adicione `CLOUDFLARE_API_TOKEN`
3. Adicione `DATABASE_URL`
4. Adicione `BETTER_AUTH_SECRET`

---

## Monitoramento & Depuração

### Ver Logs

```bash
# Logs em tempo real
wrangler tail

# Filtrar por status
wrangler tail --status error

# Filtrar por método
wrangler tail --method POST
```

### Monitoramento de Desempenho

Painel Cloudflare → Workers & Pages → Analytics:

- Contagem de requisições
- Taxa de erro
- Tempo de CPU
- Tempo de resposta

### Monitoramento de Banco de Dados

Painel Neon → Monitoring:

- Contagem de conexões
- Desempenho de consultas
- Uso de armazenamento

---

## Escalonamento

### Cloudflare Workers

- **Nível gratuito**: 100.000 requisições/dia
- **Nível pago**: Requisições ilimitadas ($5/mês + $0,50/milhão de requisições)
- **Escalonamento automático**: Lida com picos de tráfego automaticamente

### Banco de Dados Neon

- **Nível gratuito**: 0,5 GB de armazenamento, 1 unidade de computação
- **Nível pago**: Escale computação e armazenamento independentemente
- **Pooling de conexões**: Integrado, nenhuma configuração necessária

---

## Backup & Recuperação

### Backups de Banco de Dados

Neon fornece backups automáticos:

- **Recuperação point-in-time**: Restaure para qualquer ponto nos últimos 7 dias (nível gratuito)
- **Backups manuais**: Crie ramificação para backup de longo prazo

```bash
# Criar ramificação de backup
neon branches create --name backup-2026-01-15
```

### Exportar Dados

```bash
# Exportar todos os dados
pg_dump $DATABASE_URL > backup.sql

# Restaurar
psql $DATABASE_URL < backup.sql
```

---

## Lista de Verificação de Segurança

- [ ] Usar um `BETTER_AUTH_SECRET` forte (32+ caracteres)
- [ ] Ativar Cloudflare WAF (Web Application Firewall)
- [ ] Configurar limitação de taxa no Cloudflare
- [ ] Usar variáveis de ambiente para todos os segredos
- [ ] Ativar HTTPS apenas (padrão Cloudflare)
- [ ] Revisar lista de permissões de IP Neon (se necessário)
- [ ] Ativar log de auditoria
- [ ] Configurar alertas de monitoramento

---

## Solução de Problemas

### Erros de Compilação

**Erro**: `Cannot find module '../db'`

**Solução**: Garanta importações dinâmicas em funções de servidor:

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb() // ✅
```

### Erros de Conexão com Banco de Dados

**Erro**: `Connection timeout`

**Solução**: Verifique se o projeto Neon está ativo (não suspenso):

```bash
# Acordar banco de dados
curl $DATABASE_URL
```

### Erros de Worker

**Erro**: `Script startup exceeded CPU limit`

**Solução**: Reduza o tamanho do pacote:

```bash
# Analisar pacote
bun run build --analyze

# Verificar grandes dependências
du -sh node_modules/*
```

### Erros de Migração

**Erro**: `relation "table" already exists`

**Solução**: Verifique status da migração:

```bash
bun run db:status

# Se necessário, reverta e execute novamente
bun run db:rollback
bun run db:migrate
```

---

## Otimização de Desempenho

### Cloudflare

- Ativar cache para ativos estáticos
- Usar CDN Cloudflare para imagens
- Ativar compressão Brotli
- Configurar regras de cache personalizadas

### Banco de Dados

- Adicionar índices para consultas comuns (já incluído)
- Usar pooling de conexões (padrão Neon)
- Monitorar consultas lentas no painel Neon
- Considerar réplicas de leitura para alto tráfego

### Aplicativo

- Ativar cache PWA
- Otimizar imagens (formato WebP)
- Lazy loading de componentes
- Usar React.memo para componentes caros

---

## Estimativa de Custos

### Nível Gratuito (Adequado para pequenas fazendas)

- **Cloudflare Workers**: 100.000 requisições/dia
- **Banco de Dados Neon**: 0,5 GB de armazenamento, 1 unidade de computação
- **Total**: $0/mês

### Nível Pago (Adequado para fazendas médias)

- **Cloudflare Workers**: $5/mês + uso
- **Banco de Dados Neon**: $19/mês (2 unidades de computação, 10 GB)
- **Total**: ~$25/mês

### Empresarial (Grandes fazendas, vários locais)

- **Cloudflare Workers**: Preços personalizados
- **Banco de Dados Neon**: Preços personalizados
- **Total**: Contatar vendas

---

## Próximos Passos

1. **Configurar monitoramento**: Configure alertas para erros
2. **Ativar backups**: Agende backups regulares do banco de dados
3. **Domínio personalizado**: Adicione o domínio da sua fazenda
4. **SMS/Email**: Configure provedores de produção
5. **Integração**: Crie primeira fazenda e convide usuários

---

## Suporte

- **Documentação**: [docs/INDEX.md](./INDEX.md)
- **Problemas GitHub**: [github.com/yourusername/livestockai/issues](https://github.com/yourusername/livestockai/issues)
- **Comunidade**: [Link Discord/Slack]

---

**Última Atualização**: 15 de Janeiro de 2026
