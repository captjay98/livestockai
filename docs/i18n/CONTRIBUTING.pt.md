# Contribuindo para o LivestockAI

Obrigado pelo seu interesse em contribuir! Adoramos pull requests de todos. Ao participar deste projeto, você concorda em respeitar nosso Código de Conduta e seguir nossas diretrizes de colaboração.

## 1. Fluxo de Trabalho de Desenvolvimento

1.  **Fork** o repositório no GitHub.
2.  **Clone** seu fork localmente:
    ```bash
    git clone https://github.com/seu-usuario/livestock-ai.git
    ```
3.  **Crie um Branch** para seu trabalho. Usamos o formato `type/curta-descricao`:
    - `feat/add-batch-analysis`
    - `fix/login-error-toast`
    - `docs/update-readme`

## 2. Convenções de Commit

Seguimos a especificação **[Conventional Commits](https://www.conventionalcommits.org/)**. Isso nos ajuda a gerar logs de alterações e números de versão automaticamente.

**Formato**: `<type>(<escopo>): <descricao>`

### Tipos Permitidos:

- `feat`: Um novo recurso para o usuário (ex: "adicionar gráfico de previsão").
- `fix`: Uma correção de bug (ex: "corrigir estoque negativo ao deletar").
- `docs`: Apenas alterações na documentação.
- `style`: Formatação, ponto e vírgula faltando, etc (sem alteração de código de produção).
- `refactor`: Uma alteração de código que não corrige um bug nem adiciona um recurso.
- `perf`: Uma alteração de código que melhora o desempenho.
- `test`: Adicionar testes ausentes ou corrigir testes existentes.
- `chore`: Alterações no processo de build ou ferramentas auxiliares (ex: "atualizar deps").

### Exemplos:

- `feat(auth): implement google oauth login`
- `fix(db): add missing index on batch_id`
- `docs: update installation steps in readme`

## 3. Diretrizes de Pull Request

- **Um Recurso por PR**: Mantenha suas alterações focadas.
- **Auto-Revisão**: Revise seu próprio código antes de enviar.
- **Testes**: Garanta que todos os testes passem. Se adicionar um recurso, adicione um teste correspondente.
- **Linting**: Execute o linter localmente para garantir que não haja regressões de estilo.

## 4. Atalhos de Desenvolvimento Local

Usamos `bun` para gerenciamento de pacotes e scripts.

- **Instalar Dependências**: `bun install`
- **Rodar Servidor Dev**: `bun dev`
- **Lint & Format**: `bun check` (Roda Prettier & ESLint)
- **Rodar Testes**: `bun run test`
- **Banco de Dados**:
  - Migrar: `bun run db:migrate`
  - Seed (produção): `bun run db:seed` - Usuário Admin + dados de referência
  - Seed (desenvolvimento): `bun run db:seed:dev` - Dados de demonstração completos com fazendas, lotes, transações

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a Licença MIT.
