# Learn AI

Plataforma educacional de letramento em IA: app React 19 + Vite 8 + Tailwind CSS v4 (pasta `src/`), com API de cadastro/login em Node e banco libSQL (SQLite local no desenvolvimento, Turso em produção na Vercel).

## Comandos

- `pnpm dev`: servidor local (a API roda no mesmo servidor pelo plugin `server/vite-plugin.js`, com banco em `data/learnai.sqlite`)
- `pnpm test`: Vitest (frontend em jsdom e backend em `server/**/*.test.js`)
- `pnpm exec tsc --noEmit`: checagem de tipos
- `pnpm test:e2e`: Playwright sobre o build local (`E2E_BASE_URL` para rodar contra o deploy)
- `pnpm definir-senha -- email` e `pnpm tornar-admin -- email`: ferramentas administrativas locais

Versões: Node 22 e pnpm 9.15.9, as mesmas do CI (`.github/workflows/testes.yml`).

## Estrutura

- `src/main.tsx`: entrada; mostra a splash (`src/SplashScreen.tsx`) e monta `src/components/AccountGate.tsx`
- `src/components/AccountGate.tsx`: sessão, cadastro/login (`RegistrationForm.tsx`) e painel do administrador (`AdminPanel.tsx`)
- `src/App.tsx`: aplicação de aprendizagem (trilhas, quizzes, prática, projetos, perfil)
- `src/data/`: conteúdo das lições e exercícios; `src/lib/`: progresso (`localStorage`), resultados e recomendações
- `server/routes.js`: API (`/api/usuarios`, `/api/login`, `/api/sessao`, `/api/conteudo`, `/api/admin/conteudo`)
- `server/database.js`: banco, migrações e consultas; `server/passwords.js`: hash scrypt
- `api/`: funções serverless da Vercel, que reaproveitam `server/routes.js`
- `shared/`: validação e textos padrão usados no cliente e no servidor
- `tests/e2e/`: testes de sistema Playwright

## Cuidados

- Imagens e vídeos são enviados ao Git LFS por padrão (`.gitattributes`). Arquivos servidos pelo site em `public/` precisam de uma exceção no `.gitattributes`, senão a Vercel publica o ponteiro de 131 bytes no lugar do arquivo.
- Contas e sessões ficam no servidor; o progresso de aprendizagem fica no navegador, separado por e-mail.
- Leia o `CONTRIBUTING.md` antes de abrir um pull request.
