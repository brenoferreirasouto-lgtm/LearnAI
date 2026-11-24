# Como contribuir com o Learn AI

Este guia explica como rodar o projeto, propor uma mudança e levá-la até a `main`. Toda mudança passa por uma issue, uma branch própria e um pull request aprovado por outra pessoa.

## Pré-requisitos

- **Node.js 22.13 ou mais novo**, a versão mínima declarada em `engines` no `package.json`.
- **pnpm 9**, a mesma versão do CI (9.15.9). Com o Corepack: `corepack prepare pnpm@9.15.9 --activate`.
- **Git** com o e-mail da sua conta do GitHub (veja [Padrão de commit](#padrão-de-commit)).

## Rodar o projeto

```bash
pnpm install
pnpm dev
```

O `pnpm dev` sobe o app e a API de cadastro juntos: a API roda dentro do servidor do Vite (`server/vite-plugin.js`) e grava os dados em `data/learnai.sqlite`, pasta que fica fora do Git. Para trocar a senha de uma conta local, use `pnpm definir-senha email@exemplo.com` num terminal interativo; para tornar uma conta administradora, `npm run tornar-admin -- email@exemplo.com`. Os detalhes do cadastro, inclusive como fazer isso em produção, estão em [docs/f15-cadastro-usuario.md](docs/f15-cadastro-usuario.md).

## Testes

| Comando | O que roda |
|---|---|
| `pnpm test` | Testes unitários e de integração (Vitest + Testing Library): `src/**/*.test.ts(x)` e `server/**/*.test.js` |
| `pnpm exec vitest run --coverage` | Os mesmos testes, com relatório de cobertura em `coverage/` |
| `pnpm exec tsc --noEmit` | Checagem de tipos do TypeScript |
| `pnpm test:e2e` | Testes de sistema (Playwright) em `tests/e2e/`, sobre um build local |

Antes do primeiro `pnpm test:e2e`, instale o navegador com `pnpm exec playwright install chromium`. Para rodar os testes de sistema contra o site publicado, defina `E2E_BASE_URL=https://learnai-cesar.vercel.app` antes do comando. Esses testes criam contas de teste (`@example.com`) no banco de produção.

Cada história tem seus cenários de sistema num `test.describe` com o código dela no nome, como `F15 — Cadastro de usuário`. Uma história nova ou alterada entra com teste.

O CI (`.github/workflows/testes.yml`) roda dois checks em todo pull request para a `main`: `testes` (checagem de tipos com `tsc` e Vitest com cobertura) e `Testes de sistema (Playwright)`. Os dois precisam passar para o merge.

## Fluxo de trabalho

1. Abra ou escolha uma [issue](#issues) e mova o card dela no Trello para **Em Andamento**.
2. Crie a branch a partir da `main` atualizada:

   ```bash
   git switch main
   git pull
   git switch -c feat/nome-curto
   ```

   Prefixos: `feat/` para funcionalidade, `fix/` para correção, `test/` para testes e `docs/` para documentação.
3. Faça a mudança em commits pequenos, rodando os testes antes de cada um.
4. Envie a branch com `git push -u origin feat/nome-curto` e abra o pull request para a `main`.
5. Mova o card para **Revisão do código** e anexe o link do PR.
6. Depois da aprovação e do merge, apague a branch e mova o card para **Concluido**. O merge na `main` publica a produção na Vercel (https://learnai-cesar.vercel.app); cada PR também ganha um preview com uma cópia do banco.

## Padrão de commit

- Verbo no presente, em português, na terceira pessoa: "Adiciona", "Corrige", "Atualiza", "Remove".
- Primeira linha com até 72 caracteres, sem ponto final. Se precisar explicar, deixe uma linha em branco e escreva o porquê no corpo.
- Exemplos do histórico: `Corrige imagem de fundo do hero fora do Git LFS`, `Inclui testes do backend F15 no Vitest`.
- O e-mail configurado no Git precisa ser o mesmo da sua conta do GitHub, senão o commit não aparece no seu perfil:

  ```bash
  git config --global user.name "Seu Nome"
  git config --global user.email "o-email-da-sua-conta-do-github"
  ```

  Se o e-mail estiver oculto no GitHub, use o endereço `noreply` que aparece em <https://github.com/settings/emails>.

## Pull requests e revisão

- A `main` é protegida: nada entra por push direto, nem do dono do repositório.
- Todo PR precisa de **1 aprovação de outra pessoa** e dos dois checks do CI verdes. Um commit novo depois da aprovação descarta a aprovação, e a revisão precisa ser refeita.
- O PR abre com o modelo de `.github/pull_request_template.md`. Preencha a issue em `Closes #N`, o que mudou, como testar e o checklist. Com `Closes #N`, a issue fecha sozinha no merge.
- Peça a revisão em **Reviewers**. Quem revisa lê o código, roda o que achar necessário e aprova ou pede mudanças com comentários no próprio PR.
- Depois da aprovação, quem abriu o PR faz o merge e apaga a branch.

## Issues

- Abra uma issue para cada bug, melhoria ou tarefa antes de começar a trabalhar nela.
- Estrutura usada no projeto: **Contexto**, **Impacto**, **Resultado esperado**, **Critérios de aceitação** (em checklist) e **Plano**.
- Rótulos: `bug` (algo não funciona), `enhancement` (melhoria), `test` (testes automatizados) e `documentation` (documentação).
- Preencha o responsável e o milestone da entrega em andamento.

## Trello

Cada issue tem um card no [board do projeto](https://trello.com/b/H73rMBcf/kanban-learn-ai), que anda junto com o trabalho: **A FAZER** → **Em Andamento** (ao começar) → **Revisão do código** (ao abrir o PR, com o link anexado) → **Concluido** (depois do merge). Cada pessoa move o próprio card.

## Uso de IA

O projeto usa ferramentas de IA como apoio ao desenvolvimento (veja "Uso de Inteligência Artificial no projeto" no README). Regras:

- Quem faz o commit é responsável pelo código e precisa saber explicá-lo.
- Toda sugestão de IA é revisada e testada antes do commit.
- Commits feitos com ajuda de IA levam, no fim da mensagem, a linha `Co-authored-by` da ferramenta. Exemplo: `Co-authored-by: Claude <noreply@anthropic.com>`.
- No PR, a seção **Uso de IA** diz o que a ferramenta fez.
