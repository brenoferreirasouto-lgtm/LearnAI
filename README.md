# Learn AI

F15 — cadastro com banco (SQLite no desenvolvimento, Turso em produção): [como executar e roteiro de demonstração](docs/f15-cadastro-usuario.md).
![Learn AI - Nova identidade visual](./learn-ai-nova.png.png)

> Plataforma web educacional para promover o letramento em Inteligência Artificial por meio de conteúdos curtos, situações práticas, exercícios interativos e acompanhamento de progresso.

## Deploy

- **Aplicação publicada:** https://learnai-cesar.vercel.app
- **Plataforma:** Vercel (projeto `learnai-cesar`). O site é o build do Vite; a API de cadastro roda como funções serverless em `api/`.
- **Origem do deploy:** branch `main`. Cada merge na `main` publica a produção automaticamente; cada pull request ganha um preview.
- **Banco de dados:** Turso (libSQL), ligado ao projeto pela integração da Vercel. Contas, senhas (hash scrypt) e sessões ficam no banco; a produção usa sempre o banco principal e os previews usam uma cópia separada.
- **Conta de administrador:** criada pelo próprio site e promovida com `npm run tornar-admin` ([como fazer](docs/f15-cadastro-usuario.md)). Não há senha no repositório; o acesso de administrador foi enviado ao professor em particular.
- **Validação:** 67 testes Vitest e 15 testes Playwright aprovados na `main`; os 15 testes de sistema também passam contra a URL publicada (`E2E_BASE_URL=https://learnai-cesar.vercel.app pnpm test:e2e`).
- **Endereço anterior:** `learn-ai-mu-pied.vercel.app` era um projeto na conta de um integrante, publicado a partir da branch `feature/f15-cadastro-usuario` e sem a API de cadastro. Foi substituído pelo projeto acima, que publica a `main` com o banco.

## Produto oficial

O produto do Learn AI é o **app React + Vite** (pasta `src/`), publicado a partir da `main`.

O protótipo em Next.js das branches `feat/fase-*` foi descontinuado e serve apenas como histórico; nenhuma história é contabilizada a partir dele.

## Como executar e testar

```bash
pnpm install
pnpm dev          # servidor local
pnpm test         # testes unitários e de integração (Vitest + Testing Library)
pnpm exec playwright install chromium
pnpm test:e2e     # testes de sistema ponta a ponta (Playwright) sobre o build local
```

Para rodar os mesmos testes de sistema contra o deploy publicado, defina `E2E_BASE_URL=https://learnai-cesar.vercel.app` antes de `pnpm test:e2e`.

Os testes de sistema ficam em `tests/e2e/` e cobrem as 15 histórias (F01 a F15). A checagem de tipos (`pnpm exec tsc --noEmit`) e os dois conjuntos de testes rodam no GitHub Actions a cada push e pull request para a `main` (`.github/workflows/testes.yml`).

**Screencast dos testes** (checagem de tipos, Vitest com cobertura, Playwright e GitHub Actions): https://youtu.be/XnDWPVCBxqc

Para contribuir (branches, padrão de commit, pull requests e revisão), leia o [CONTRIBUTING.md](CONTRIBUTING.md).

## Sobre o projeto

O **Learn AI** é um projeto desenvolvido para a disciplina de **Fundamentos de Desenvolvimento de Software (FDS)**.

A proposta é criar uma aplicação web voltada ao **letramento em Inteligência Artificial**, ajudando estudantes a compreender conceitos fundamentais sobre IA generativa e a utilizá-la de maneira mais crítica, segura e eficiente.

O projeto busca abordar temas como:

- funcionamento básico de IAs generativas;
- limitações e alucinações;
- privacidade e compartilhamento de dados;
- construção de prompts;
- verificação de informações;
- boas práticas de uso;
- acompanhamento do aprendizado.

---

## Problema

Ferramentas de Inteligência Artificial generativa estão cada vez mais presentes no cotidiano acadêmico e profissional. Entretanto, muitos usuários utilizam essas ferramentas sem compreender adequadamente suas limitações, riscos e boas práticas.

Entre os principais problemas identificados estão:

- confiar automaticamente em respostas produzidas por IA;
- dificuldade para reconhecer informações incorretas ou inventadas;
- compartilhamento indevido de dados pessoais ou sensíveis;
- dificuldade para formular prompts claros;
- falta de hábito de verificar fontes e informações;
- uso da IA sem compreensão crítica de seus resultados.

---

## Solução

O **Learn AI** será uma plataforma web educacional composta por uma trilha de aprendizagem sobre Inteligência Artificial.

O usuário poderá acessar conteúdos curtos, realizar exercícios e quizzes, receber feedback sobre suas respostas e acompanhar seu progresso ao longo da trilha.

A estrutura inicial da aplicação será:

```text
Usuário
   ↓
Cadastro / Login
   ↓
Trilha de aprendizagem
   ↓
Conteúdos
   ↓
Exercícios e quizzes
   ↓
Feedback
   ↓
Acompanhamento de progresso
```

---

## Objetivo

Promover o letramento em Inteligência Artificial entre estudantes, oferecendo uma experiência de aprendizagem prática que ajude o usuário a:

- compreender conceitos básicos de IA generativa;
- reconhecer limitações e possíveis alucinações;
- utilizar IA de forma mais segura;
- construir prompts mais claros;
- verificar informações produzidas por IA;
- desenvolver uma postura crítica no uso dessas tecnologias.

---

## Público-alvo

O público-alvo inicial do Learn AI é composto por:

Estudantes do ensino médio, técnico e superior, que usam ferramentas de IA para pesquisar, estudar, fazer trabalhos e tirar dúvidas, e aqueles que estão começando nessa jornada, aprendendo assim a utilizá-las de forma mais crítica, segura, eficiente e de forma produtiva.

Esse público geralmente busca respostas rápidas, prefere conteúdos visuais e interativos e pode ter dificuldades para identificar informações falsas, criar bons prompts ou verificar se uma resposta da IA é realmente confiável.

---

## Diferencial

O Learn AI não pretende apenas apresentar conceitos teóricos sobre Inteligência Artificial.

O diferencial da plataforma será utilizar **situações práticas e exercícios interativos**, permitindo que o usuário aprenda enquanto toma decisões relacionadas ao uso real de ferramentas de IA.

Exemplos:

- identificar uma possível alucinação;
- escolher qual informação não deve ser compartilhada com uma IA;
- comparar um prompt ruim com um prompt bem estruturado;
- verificar se uma resposta gerada por IA possui informações confiáveis.

---

## ODS relacionado

O projeto está relacionado principalmente ao:

### ODS 4 — Educação de Qualidade

O Learn AI busca ampliar o acesso a conhecimentos importantes para o uso consciente e responsável de novas tecnologias, contribuindo para o desenvolvimento de competências digitais.

---

# Equipe

| Integrante | Papel principal |
|---|---|
| Breno Ferreira | Product Owner |
| Bruno Rodrigues | Gestão do Processo |
| Vinicius Beleza | UX/UI |
| Pedro Freitas | Front-end |
| João Fernando | Back-end |

---

# Product Backlog

As histórias foram organizadas por prioridade, considerando primeiro as funcionalidades necessárias para formar o fluxo básico da aplicação.

## Prioridade P0 — Essenciais

| ID | História de Usuário |
|---|---|
| **F01** | Como estudante, quero acessar uma introdução sobre IA generativa para entender seus conceitos básicos. |
| **F02** | Como usuário, quero realizar um quiz de nivelamento para descobrir meu nível de conhecimento sobre IA. |
| **F03** | Como usuário, quero ser direcionado para o nível adequado após o quiz para começar o curso com conteúdos compatíveis com meu conhecimento. |
| **F04** | Como estudante, quero aprender a identificar alucinações de IA para não confiar automaticamente em respostas geradas. |
| **F05** | Como estudante, quero continuar meus estudos de onde parei para não precisar procurar novamente o conteúdo. |
| **F06** | Como estudante, quero montar um prompt seguindo etapas guiadas para transformar uma necessidade em uma instrução clara para a IA. |
| **F07** | Como estudante, quero comparar prompts bons e ruins, para entender na prática o que diferencia um prompt eficiente de um mal elaborado. |
| **F08**| Como estudante, quero aprender a verificar informações produzidas por IA para reduzir o risco de desinformação. |

## Prioridade P1 — Importantes

| ID | História de Usuário |
|---|---|
| **F09** | Como estudante, quero visualizar meu progresso para saber quanto da trilha já concluí. |
| **F10** | Como estudante, quero visualizar meu resultado final para saber como foi meu desempenho na trilha de aprendizagem. |
| **F11** | Como estudante, quero receber recomendações de conteúdo com base no meu desempenho para saber quais temas devo revisar ou aprofundar. |
| **F12** | Como estudante, quero realizar um quiz ao final de uma etapa para avaliar o que aprendi. |
| **F13** |Como estudante, quero receber feedback dos exercícios que realizo, para entender meus erros e acertos e evoluir no aprendizado. |

## Prioridade P2 — Complementares

| ID | História de Usuário |
|---|---|
| **F14** | Como usuário, quero ter acesso a um menu interativo com todas as funcionalidades disponíveis no sistema para encontrar e utilizar os recursos de forma fácil e organizada. |
| **F15** | Como estudante, quero criar uma conta para acompanhar meu aprendizado. |

---

# Histórias de Usuário — Padrão 3Cs

Cada história do backlog deve ser detalhada no Board utilizando o padrão **3Cs**:

### Card

Descrição curta da necessidade do usuário.

Exemplo:

> Como estudante, quero aprender a identificar alucinações de IA para não confiar automaticamente em respostas geradas.

### Conversation

Contexto e discussão sobre como a funcionalidade deverá funcionar.

Exemplo:

> O usuário receberá situações nas quais uma IA apresenta informações verdadeiras ou incorretas. O objetivo é desenvolver uma postura crítica diante das respostas geradas por IA.

### Confirmation

Critérios utilizados para confirmar que a história foi atendida.

Exemplo:

- [ ] Um cenário é apresentado ao usuário.
- [ ] O usuário consegue selecionar uma resposta.
- [ ] O sistema informa se a resposta está correta.
- [ ] Uma explicação é exibida após a resposta.

---

# Planejamento inicial das Sprints

A divisão abaixo representa uma proposta inicial e pode ser ajustada durante o refinamento do backlog.

## Sprint 01







https://github.com/user-attachments/assets/bbbb2e44-8251-4950-96a9-3016804ead6b








**Objetivo:** disponibilizar o fluxo inicial de acesso e aprendizagem.

- [F01 — Aula sobre IA generativa](https://github.com/user-attachments/assets/c68799a0-d47c-46b5-ab6c-a187649ee661)
- [Diagrama](https://github.com/user-attachments/assets/1aac7498-9816-4600-8dd3-8a29a60ff1e3)

- [F02 — Quiz de nivelamento](https://github.com/user-attachments/assets/fcbc0ffd-302c-43e6-833d-f33542ea2fa3)
- [Diagrama](https://github.com/user-attachments/assets/c9fc1383-c652-404f-96dc-38ed1e09c394)

- [F03 — Direcionamento por nível](https://github.com/user-attachments/assets/dee3c239-d571-4105-bc70-b888cc5e4e9f)
- [Diagrama](https://github.com/user-attachments/assets/868e2d7f-1d35-497d-9eab-4e2fc91c06f1)

- [F04 — Quiz de identificação de alucinações](https://github.com/user-attachments/assets/0baed2a1-2cca-4a6b-b638-a30bfe150f20)
- [Diagrama](https://github.com/user-attachments/assets/8114fea9-eb4b-44a5-bbfa-b3744f4cd6fd)

- [F05 — Continuar estudo de onde parou](https://github.com/user-attachments/assets/fa78b2c8-b1af-4663-b138-754df373262e)
- [Diagrama](https://github.com/user-attachments/assets/fcafd75e-07b7-4150-90a7-3529f145d6f8)

## Sprint 02

**Objetivo:** ampliar a experiência de aprendizagem com feedback, segurança e prompting.

- [F06 — Construtor guiado de prompts](https://github.com/user-attachments/assets/7fccf2b5-2529-47c1-8d12-bd22bda32f8a)
- [Diagrama](https://github.com/user-attachments/assets/ae1781bc-75af-49e8-8b94-df08b800bd71)

- [F07 — Menu de comparação de prompts — evidência em vídeo](https://trello.com/1/cards/6ad91477009dc62edf0259b1/attachments/6afb48661c7804b96b21d671/download/F07_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/d0774560-d611-41cf-94ca-85a3c3bf81b5)

- [F08 — Verificar informações produzidas por IA — evidência em vídeo](https://trello.com/1/cards/6ad9147e64fd6dac0df5e3c2/attachments/6afb4b054b4aeb79f1e7f2c2/download/F08_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/963c8f34-43a6-412e-b32a-7e445d3b0606)

- [F09 — Dashboard de progresso do usuário — evidência em vídeo](https://trello.com/1/cards/6ad91484df8cf1e54069b929/attachments/6afb4fa7e18d472b53f3b7e1/download/F09_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/7af5c267-f888-4d47-95bb-12b7aab7eabc)

- [F10 — Visualizar resultado final — evidência em vídeo](https://trello.com/1/cards/6ad9148ce210b387868b333e/attachments/6afb51b5ce123880f2f3437f/download/F10_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/8b8e696f-e974-4acd-b7e1-98b1dd1c33fe)

- [F11 — Recomendações de aprendizagem — evidência em vídeo](https://trello.com/1/cards/6ad91495434a7b864f180c6f/attachments/6afb77fe8293213f8dcc7208/download/F11_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/da78f460-08cd-4373-9241-cd37279f5ffa)



## Sprint 03

**Objetivo:** consolidar o aprendizado e permitir acompanhamento de desempenho.

- [F12 — Quiz de avaliação do aprendizado — evidência em vídeo](https://trello.com/1/cards/6ad914a797ff7111a691c136/attachments/6afb79a2a989d8ac31363cf0/download/F12_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/753a813d-43d6-4e9c-ac8d-1d120cc76be9)

- [F13 — Sistema de feedback dos exercícios — evidência em vídeo](https://trello.com/1/cards/6ad914ae4c6034ac30fa4d60/attachments/6afb7bc12474beb030a276f5/download/F13_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/e2f76ef4-596d-49ea-aa72-568b802739f5)

- [F14 — Menu interativo com todas as funcionalidades — evidência em vídeo](https://trello.com/1/cards/6ad914b439f23bdd861b3c18/attachments/6afb7d1f808b622e1714fb3d/download/F14_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/9a49977b-bdff-4900-be4f-1e637f40e040)

- [F15 — Cadastro de usuário — evidência em vídeo](https://trello.com/1/cards/6ad914b97724f38cbdbe6acd/attachments/6afcd1e73e7a22c18bc726f7/download/F15_com_legendas.mp4)
- [Diagrama](https://github.com/user-attachments/assets/29468629-43eb-46ac-bc65-0064480cf32d)

---
### 🟢 Sprint 01

| Dupla | História | O que a dupla implementou | Aprendizados |
|:-----:|:---------|:--------------------------|:-------------|
| Pedro + Bruno | *F01* — Aula sobre IA generativa | Conteúdo introdutório sobre IA generativa, com explicação dos conceitos básicos para o estudante | Aprendemos a organizar o conteúdo em componentes e a utilizar o Git para registrar as primeiras alterações. |
| Breno + Vinicius | *F02* — Quiz de nivelamento | Quiz inicial para medir o conhecimento prévio do estudante sobre IA | Aprendemos a implementar perguntas interativas, validar respostas e trabalhar em dupla sem sobrescrever alterações. |
| João + Pedro | *F03* — Direcionamento por nível | Lógica que usa o resultado do quiz para encaminhar o estudante ao nível adequado da trilha | Aprendemos a utilizar estruturas condicionais e a testar diferentes resultados antes de integrar o código. |
| Bruno + Breno | *F04* — Quiz de identificação de alucinações | Exercício com respostas de IA em que o estudante identifica informações incorretas ou inventadas | Aprendemos a separar a lógica dos exercícios da interface e a revisar as alterações antes de fazer o commit. |
| Vinicius + João | *F05* — Continuar estudo de onde parou | Salvamento do ponto de parada, para o estudante retomar a trilha do último conteúdo acessado | Aprendemos a persistir o progresso do usuário e a verificar se as alterações continuavam funcionando após a integração. |

---

### Relato de programação em pares — Sprint 02

Durante a Sprint 02, a equipe realizou atividades em programação em pares. Nas sessões, um integrante ficou responsável pela implementação e navegação no código, enquanto o outro acompanhou o raciocínio, revisou as alterações e ajudou na validação da solução em tempo real.

As duplas registradas para a Sprint 02 foram:

- F06 — Pedro + Breno
- F07 — Bruno + Vinicius
- F08 — João + Bruno
- F09 — Breno + João
- F10 — Pedro + Vinicius
- F11 — Bruno + Pedro

A prática contribuiu para revisão conjunta das soluções, compartilhamento de conhecimento e identificação de problemas antes da integração das alterações ao projeto.

---

### 🔵 Sprint 02

| Dupla | História | O que a dupla implementou | Aprendizados |
|:-----:|:---------|:--------------------------|:-------------|
| Pedro + Breno | *F06* — Construtor guiado de prompts | Montagem de prompts por campos guiados, para praticar a estrutura de um bom prompt | Aprendemos a trabalhar com formulários, organizar os dados de entrada e manter o código legível. |
| Bruno + Vinicius | *F07* — Menu de comparação de prompts | Tela que compara prompts bons e ruins, destacando as boas práticas | Aprendemos a reutilizar componentes da interface e a comparar diferentes versões do código usando o Git. |
| João + Bruno | *F08* — Verificar informações produzidas por IA | Conteúdo e exercício sobre como checar a veracidade de respostas geradas por IA | Aprendemos a estruturar orientações de verificação e a criar exercícios que incentivam o pensamento crítico. |
| Breno + João | *F09* — Dashboard de progresso do usuário | Painel que mostra quanto da trilha o estudante já concluiu | Aprendemos a calcular o progresso a partir dos dados do usuário e a apresentar essas informações visualmente. |
| Pedro + Vinicius | *F10* — Visualizar resultado final | Tela de resultado ao fim da trilha, com o desempenho do estudante | Aprendemos a organizar os resultados dos exercícios e a apresentar um resumo claro do desempenho. |
| Bruno + Pedro | *F11* — Recomendações de aprendizagem | Sugestões de temas para revisar, com base no desempenho | Aprendemos a utilizar os resultados dos exercícios para criar recomendações e a testar diferentes cenários. |

---

### 🟣 Sprint 03

Relato refeito a partir do histórico do Git (issue #40). A versão anterior listava duplas que os commits não confirmam; cada linha abaixo aponta o commit ou PR que comprova a autoria.

| História | Quem fez, segundo o Git | Evidência | Uso de IA |
|:---------|:------------------------|:----------|:----------|
| *F12* — Quiz de avaliação do aprendizado | Bruno | Commit [`7bc1287`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/7bc1287) (21/10), integrado no [PR #18](https://github.com/brenoferreirasouto-lgtm/LearnAI/pull/18) | Faz parte da versão completa do site gerada com apoio do Codex (branch `codex/site-completo-para-avaliacao`, hoje arquivada na tag `arquivo/codex/site-completo-para-avaliacao`) |
| *F13* — Sistema de feedback dos exercícios | Bruno; testes de sistema por Vinicius | Commit [`7bc1287`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/7bc1287) ([PR #18](https://github.com/brenoferreirasouto-lgtm/LearnAI/pull/18)); testes no commit [`49497cc`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/49497cc) (17/11) | Código da versão gerada com apoio do Codex; testes escritos com apoio do Claude (`Co-authored-by` no commit) |
| *F14* — Menu interativo com todas as funcionalidades | Bruno; testes de sistema por Vinicius | Commit [`7bc1287`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/7bc1287) ([PR #18](https://github.com/brenoferreirasouto-lgtm/LearnAI/pull/18)); testes no commit [`49497cc`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/49497cc) (17/11) | Código da versão gerada com apoio do Codex; testes escritos com apoio do Claude (`Co-authored-by` no commit) |
| *F15* — Cadastro de usuário | Bruno: cadastro com banco, login com senha, perfis, testes e deploy; Vinicius: primeiros testes de sistema | Commits de Bruno em 16 e 17/11 ([`80f400e`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/80f400e), [`814cab5`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/814cab5), [`c0fd1b0`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/c0fd1b0), [`e4c6e0e`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/e4c6e0e), [`9ccabbe`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/9ccabbe)), integrados no [PR #31](https://github.com/brenoferreirasouto-lgtm/LearnAI/pull/31); testes no commit [`49497cc`](https://github.com/brenoferreirasouto-lgtm/LearnAI/commit/49497cc) | Testes de sistema escritos com apoio do Claude (`Co-authored-by` no commit) |

Os testes de sistema de F02, F03, F04 e F12 e as correções da entrega final (issues #33 a #43) foram integrados na `main` pelos [pull requests #44 a #57](https://github.com/brenoferreirasouto-lgtm/LearnAI/pulls?q=is%3Apr+is%3Amerged), todos revisados e aprovados por um colega antes do merge.

---
### Uso de Inteligência Artificial no projeto

Ferramentas utilizadas:

| Ferramenta | Como foi usada |
|---|---|
| **Figma Make** | Geração da base do app (React + Vite + Tailwind) e da identidade visual; os arquivos `AGENTS.md`, `CLAUDE.md` e `.figma/` vêm desse ambiente. |
| **Claude (Anthropic) / Claude Code** | Apoio na implementação, revisão de código, escrita dos testes automatizados (Vitest e Playwright) e da documentação. |
| **Codex (OpenAI)** | Apoio na geração da versão completa do site (branch `codex/site-completo-para-avaliacao`, arquivada na tag `arquivo/codex/site-completo-para-avaliacao`). |

A equipe utilizou essas ferramentas de IA generativa como apoio ao desenvolvimento do Learn AI, principalmente para revisar ideias de implementação, analisar código, estruturar e revisar testes automatizados, organizar cenários de teste, melhorar a documentação técnica e apoiar o uso de Git/GitHub durante as entregas.

As sugestões produzidas por IA foram revisadas pela equipe antes de serem incorporadas ao projeto. A validação das funcionalidades foi realizada no aplicativo em execução e por meio dos testes automatizados registrados no repositório. A IA foi utilizada como ferramenta de apoio ao processo de desenvolvimento, e não como substituta da revisão, dos testes ou das decisões da equipe.

---

### Issue / Bug Tracker

- [Issue #28 — Ajustar vite.config.ts para compatibilidade com configLoader native](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/28)
- [Issue #30 — F15: cadastro não atende critérios de e-mail e duplicidade](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/30)
- Entrega final — ajustes pedidos na avaliação da Sprint 03:
  - [Issue #33 — Publicar a API de cadastro (F15) em produção](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/33)
  - [Issue #34 — Remover as senhas de demonstração do código publicado](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/34)
  - [Issue #35 — Corrigir os erros do tsc e incluir a checagem de tipos no CI](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/35)
  - [Issue #36 — Criar testes de sistema para F02, F03, F04 e F12](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/36)
  - [Issue #37 — Extrair a recomendação do F11 para um módulo e testá-la](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/37)
  - [Issue #38 — Remover o componente Welcome, inalcançável no app](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/38)
  - [Issue #39 — Corrigir os trechos desatualizados do README](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/39)
  - [Issue #40 — Reescrever o relato de pares da Sprint 03 conforme o Git](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/40)
  - [Issue #41 — Criar o CONTRIBUTING.md](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/41)
  - [Issue #42 — Arquivar as branches do protótipo descontinuado](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/42)
  - [Issue #43 — Criar o template de pull request](https://github.com/brenoferreirasouto-lgtm/LearnAI/issues/43)
- Os issues são registrados quando os problemas são identificados durante a validação, mantendo o histórico de qualidade do projeto.
<img width="1917" height="967" alt="image" src="https://github.com/user-attachments/assets/00e086a1-d4df-40be-a142-110421977816" />
<img width="1965" alt="Issue #30 — F15 cadastro e duplicidade" src="https://github.com/user-attachments/assets/cb6c5b0f-e167-4110-8bad-3c84637927ba" />

---

### Visão geral das Sprints e Backlog no Trello

   - [Print Backlog](https://github.com/user-attachments/assets/cc3b53a9-f1a6-44de-b8a9-7038f97a5cef)
   - [Print Sprint01](https://github.com/user-attachments/assets/b0209723-8161-4fb7-84c1-cfdcd42f9b4f)
   - [Print Sprint02](https://github.com/user-attachments/assets/224b9e10-4a59-4e9b-aa81-918595863daf)
   - [Print Sprint03](https://github.com/user-attachments/assets/1f0b5b1c-0132-478d-a9df-96651591ab58)



---

# Board do projeto

A equipe utiliza um quadro Kanban para organizar o trabalho, priorizar o backlog e acompanhar a evolução das histórias.

**Ferramenta:** Trello

**Link do Board (público):** https://trello.com/b/H73rMBcf/kanban-learn-ai  
**Convite para entrar no board:** `https://trello.com/invite/b/6a9622309222e81119bfef2e/ATTIdfe49ca6ba86da893594140a907fd479BF1A75CC/kanban-learn-ai`

### Estrutura do Board

O fluxo de trabalho é organizado em colunas como:

```text
Problema
↓
Solução
↓
Backlog
↓
Histórias / Refinamento
↓
A Fazer
↓
Em andamento
↓
Revisão / Testes
↓
Concluído
```
---
# Roadmap

| Etapa | Objetivo |
|---|---|
| **Entrega 01** | Definição do problema, histórias de usuário, backlog, board e organização do projeto |
| **Entrega 02** | Modelagem, diagramas de atividades e prototipação |
| **Sprint 01** | Implementação das primeiras funcionalidades |
| **Sprint 02** | Evolução da aplicação e ampliação das funcionalidades |
| **Sprint 03** | Consolidação do produto, testes de sistema, documentação e deploy |
| **Entrega final** | API de cadastro em produção com banco Turso ([app publicado](https://learnai-cesar.vercel.app)), testes de sistema para as 15 histórias, issues e pull requests revisados |
---
## Learn AI

**Aprender a usar Inteligência Artificial também significa aprender quando questioná-la.**

# Equipe

[https://www.linkedin.com/in/breno-ferreira-souto-b360063a6/]
[www.linkedin.com/in/vinicius-beleza-20101542a]
[https://www.linkedin.com/in/pedro-lustosa-83a629355/]
[https://www.linkedin.com/in/joão-fernando-0a6b023b4?utm_source=share_via&utm_content=profile&utm_medium=member_ios]
[www.linkedin.com/in/bruno-rodrigues-0a9aa43b2]
