# F15 — Cadastro de usuário

Integrado na `main` e publicado em https://learnai-cesar.vercel.app.

## Perfis de usuário e administrador

No login, selecione **Usuário** (padrão) ou **Administrador**. Novos cadastros sempre são usuários; escolher admin no navegador não concede permissões. O servidor consulta o perfil do banco em cada edição.

Não existem contas prontas nem senhas no código. Para ter um administrador, crie a conta pelo site, como qualquer usuário, e depois promova essa conta no terminal do projeto:

```bash
npm run tornar-admin -- admin@exemplo.com
```

O comando só muda o perfil de uma conta que já existe. A senha continua sendo a que a pessoa escolheu no cadastro, e ela entra selecionando **Administrador**.

O administrador acessa o painel **Textos do site** e pode editar título e descrição principal e título e descrição do cadastro. Clique em **Salvar alterações**. As edições são persistidas em `conteudo_site` no banco (SQLite local ou Turso em produção) e carregadas na tela inicial dos visitantes; quem já estiver com a página aberta deve recarregar. O painel não altera código, cursos, layout ou permissões de outras contas.

Para demonstrar, entre como Administrador, altere um título, salve e saia. Confira o texto na tela inicial. Entre como Usuário: o perfil de aprendizagem é aberto, sem painel de edição. Se selecionar Administrador com credenciais de usuário, o login será recusado.

Endpoints: GET público `/api/conteudo` e PUT `/api/admin/conteudo`, que exige sessão de administrador (401 sem sessão, 403 para usuário comum).

## Executar

Use Node.js 24 (ou 22.13+) e instale as dependências com `npm install`.
Execute `npm run dev` e abra http://localhost:8443. No PowerShell, se a política de execução bloquear o npm, use `npm.cmd`.
O servidor já aberto recarrega a configuração do Vite automaticamente.

Para conferir o build: `npm run build` e `npm run preview`.
O plugin instala a API tanto no desenvolvimento quanto no preview, na mesma origem do site.
Para verificar: `npm test` e `npx tsc --noEmit`.

## Estrutura e persistência

- `src/components/RegistrationForm.tsx`: formulário e mensagens em português.
- `src/components/AccountGate.tsx`: restauração da sessão e integração com perfil.
- `src/lib/accounts.ts`: cliente HTTP.
- `shared/registration.js`: normalização e validação executadas nos dois lados.
- `server/routes.js`: POST `/api/usuarios`, POST `/api/login`, GET e DELETE `/api/sessao`.
- `server/database.js`: consultas parametrizadas, tabela `usuarios` e sessões persistentes.
- `server/vite-plugin.js`: API Node integrada ao servidor Vite.
- `api/`: funções serverless da Vercel, uma por rota, que usam o mesmo `createApi`.

O banco é acessado pelo cliente libSQL (`@libsql/client`). Em desenvolvimento ele é um arquivo SQLite, que dispensa serviço ou credenciais: `data/learnai.sqlite` é criado automaticamente e fica fora do Git. Nos testes, o banco fica em memória. Em produção, o mesmo código usa um banco Turso (veja [Produção na Vercel](#produção-na-vercel)). Não apague esse arquivo; faça backup dele para preservar os cadastros. `DATABASE_PATH` permite escolher outro caminho persistente.
A tabela `usuarios` contém `id`, `nome`, `email` UNIQUE em minúsculas e `criado_em`. Cadastro e sessão são gravados em uma transação. Duplicidade retorna HTTP 409 e a mensagem exata `E-mail já cadastrado`.

O cookie HttpOnly identifica uma sessão de 30 dias, que sobrevive a recarga e reinício. Sair invalida a sessão no banco, sem excluir usuários, e abre a tela de login. Criar outro cadastro encerra a sessão e abre o formulário de cadastro vazio. A opção **Já tenho conta** permite entrar novamente com e-mail e senha.

As senhas têm entre 8 e 128 caracteres e são persistidas como hash scrypt com salt aleatório. O campo permite salvar e preencher a senha pelo gerenciador do navegador; a aplicação não guarda senha em texto no localStorage nem a devolve pela API. Há limite de 20 tentativas de cadastro/login por minuto por IP. A contagem fica na tabela `tentativas` do banco, para valer em todas as funções da Vercel, e não só na memória de uma delas. O banco guarda apenas o hash SHA-256 do token de cada sessão; o token original fica só no cookie.

### Contas antigas criadas sem senha

A migração adiciona `senha_hash` sem apagar os cadastros existentes. Para definir a primeira senha da sua conta antiga, execute no terminal local do projeto:

```powershell
npm.cmd run definir-senha -- bruno@bruno.com
```

Digite a senha e confirme (a entrada fica oculta). A ferramenta também serve para redefinição administrativa local e invalida sessões anteriores da conta. Depois, clique em **Já tenho conta** e entre. Não existe recuperação pública por e-mail nesta versão; apenas saber o e-mail não permite definir a senha de uma conta antiga.
O progresso de aprendizagem continua local. Nome e e-mail passam a ser persistidos no servidor; antigos cadastros exclusivos do localStorage não são migrados automaticamente.

No desenvolvimento e no `vite preview`, o cadastro usa a API Node + SQLite; na Vercel, a mesma API roda em funções serverless com o banco Turso. Não existe cadastro só no navegador: se o servidor não responder, o app mostra "Servidor indisponível. Tente novamente em instantes." e não cria a conta.

## Produção na Vercel

No deploy, cada arquivo de `api/` vira uma função serverless que atende uma rota (`/api/sessao`, `/api/conteudo`, `/api/usuarios`, `/api/login` e `/api/admin/conteudo`) com o mesmo `createApi` do servidor de desenvolvimento. Os dados ficam num banco Turso, que é libSQL hospedado:

1. No projeto da Vercel, na aba **Storage**, crie um banco Turso pelo Marketplace e conecte-o aos ambientes Production e Preview. O código lê a conexão de `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.
2. Na conexão do banco com o projeto (**Storage → banco → Projects → Update Project Connection**), deixe marcado em **Create Database Branch For Deployment** só o **Preview**. Com **Production** marcado, cada deploy de produção ganha um banco novo e vazio, e as contas criadas antes somem.
3. Faça um novo deploy. As tabelas são criadas na primeira execução das funções.
4. Para ter um administrador em produção, cadastre a conta pelo site e promova-a do seu computador, apontando para o banco principal. A integração marca as variáveis como sensíveis, e a Vercel não mostra o valor delas; gere um token no painel do Turso (**Databases → banco → Create Token**) e copie o endereço `libsql://` do banco. Para o token não aparecer na tela nem ficar no histórico do terminal:

```bash
read -r TURSO_DATABASE_URL     # cole o endereço libsql:// e aperte Enter
read -rs TURSO_AUTH_TOKEN      # cole o token (não aparece) e aperte Enter
export TURSO_DATABASE_URL TURSO_AUTH_TOKEN
node server/promote-admin.js admin@exemplo.com
```

Depois, apague o token no painel do Turso; o site usa o token da integração.

Sem `TURSO_DATABASE_URL`, as funções respondem erro 500 e o log da Vercel diz o que falta configurar. Se o banco não abrir no início de uma função, a próxima requisição tenta de novo, e o erro aparece nos logs da Vercel.

## Demonstração

1. Abra o site (https://learnai-cesar.vercel.app ou `pnpm dev`); pule o vídeo de abertura se necessário.
2. Preencha nome `Ana` e e-mail `invalido`. Clique em **Criar meu espaço**: aparece `Informe um e-mail válido.` e nada é salvo. Nome composto só por espaços também é bloqueado.
3. Use `Ana`, `ANA@EXEMPLO.COM` e uma senha de pelo menos 8 caracteres. Envie: aparece sucesso e abre **Seu perfil**, com nome e e-mail `ana@exemplo.com`.
4. Recarregue a página; o perfil continua aberto. Reinicie o servidor e recarregue: o cadastro e a sessão permanecem.
5. Clique em **Sair do perfil neste dispositivo**: abre o login. Tente uma senha incorreta e confira o erro. Use o e-mail e a senha correta para entrar novamente. Recarregue e confirme que permanece conectado.
6. Clique em **Criar outro cadastro neste dispositivo**; os campos ficam vazios. Cadastre `Bruno` com `bruno@exemplo.com` e senha: um segundo cadastro é salvo sem excluir Ana.
7. No perfil, clique em **Criar outro cadastro neste dispositivo**. Tente cadastrar novamente `Ana` com ` ANA@EXEMPLO.COM ` e uma senha válida: aparece exatamente **E-mail já cadastrado**.

Os testes em `server/registration.test.js` verificam HTTP, banco real temporário, unicidade, múltiplos usuários, normalização, encerramento de sessão, reabertura do banco, hash do token da sessão e contagem de tentativas compartilhada no banco. Os testes do formulário verificam validação no cliente, limpeza e mensagem de duplicidade.

## Progresso de mais de uma conta no mesmo navegador

O progresso (XP, lições, quizzes e projetos) fica no navegador, em um registro por ID da conta autenticada.
Sair ou trocar de conta preserva o progresso. O registro individual válido tem precedência sobre o registro ativo legado.
Na ausência de ambos, o aplicativo usa o arquivo legado por e-mail. Uma origem legada só é elegível quando o e-mail
salvo corresponde à conta autenticada. Cópias divergentes, ilegíveis ou sem titular confirmado ficam preservadas.

A migração verifica a gravação antes de limpar uma cópia equivalente. Uma limpeza interrompida pode ser retomada no
próximo acesso. Com Web Locks, as abas serializam gravações e recarregam as mudanças do mesmo ID. Sem esse recurso,
o aplicativo preserva as origens e as gravações simultâneas ficam sujeitas à última gravação. Limpar os dados do site
remove o progresso local. Dispositivos e perfis de navegador diferentes mantêm cópias independentes.

### Edições simultâneas no Estúdio de Prompts

Cada edição grava somente o campo alterado, em uma chave vinculada à conta e à revisão do rascunho. Com Web Locks, leitura,
atualização e gravação usam o mesmo bloqueio. Campos diferentes são preservados. Para o mesmo campo, prevalece
a última gravação efetivada sob o bloqueio. As demais abas recebem a atualização via evento de armazenamento.
A geração do prompt também lê os campos mais recentes antes de gravar o resultado.

A redefinição do progresso cria uma nova revisão do rascunho. Edições pendentes da revisão anterior são descartadas
para evitar restaurar dados removidos. A revisão é opcional nos registros legados. Sem Web Locks, a aplicação continua
gravando por campo, mas leituras e gravações concorrentes podem se sobrepor.
