# F15 — Cadastro de usuário

Branch: `feature/f15-cadastro-usuario`.

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

SQLite foi escolhido por dispensar serviço ou credenciais adicionais. O arquivo `data/learnai.sqlite` é criado automaticamente e fica fora do Git. Não apague esse arquivo; faça backup dele para preservar os cadastros. `DATABASE_PATH` permite escolher outro caminho persistente.
A tabela `usuarios` contém `id`, `nome`, `email` UNIQUE em minúsculas e `criado_em`. Cadastro e sessão são gravados em uma transação. Duplicidade retorna HTTP 409 e a mensagem exata `E-mail já cadastrado`.

O cookie HttpOnly identifica uma sessão de 30 dias, que sobrevive a recarga e reinício. Sair invalida a sessão no banco, sem excluir usuários, e abre a tela de login. Criar outro cadastro encerra a sessão e abre o formulário de cadastro vazio. A opção **Já tenho conta** permite entrar novamente com e-mail e senha.

As senhas têm entre 8 e 128 caracteres e são persistidas como hash scrypt com salt aleatório. O campo permite salvar e preencher a senha pelo gerenciador do navegador; a aplicação não guarda senha em texto no localStorage nem a devolve pela API. Há limite de 20 tentativas de cadastro/login por minuto por IP no processo do servidor.

### Contas antigas criadas sem senha

A migração adiciona `senha_hash` sem apagar os cadastros existentes. Para definir a primeira senha da sua conta antiga, execute no terminal local do projeto:

```powershell
npm.cmd run definir-senha -- bruno@bruno.com
```

Digite a senha e confirme (a entrada fica oculta). A ferramenta também serve para redefinição administrativa local e invalida sessões anteriores da conta. Depois, clique em **Já tenho conta** e entre. Não existe recuperação pública por e-mail nesta versão; apenas saber o e-mail não permite definir a senha de uma conta antiga.
O progresso de aprendizagem continua local. Nome e e-mail passam a ser persistidos no servidor; antigos cadastros exclusivos do localStorage não são migrados automaticamente.

Hospedagem estática (incluindo apenas publicar `dist`) não executa esta API. Para publicar, é necessário servidor Node com disco persistente, ou adaptar a API a um banco remoto. Em produção HTTPS, configure `NODE_ENV=production` para cookie Secure.

## Demonstração

1. Abra o site na branch indicada; pule o vídeo de abertura se necessário.
2. Preencha nome `Ana` e e-mail `invalido`. Clique em **Criar meu espaço**: aparece `Informe um e-mail válido.` e nada é salvo. Nome composto só por espaços também é bloqueado.
3. Use `Ana`, `ANA@EXEMPLO.COM` e uma senha de pelo menos 8 caracteres. Envie: aparece sucesso e abre **Seu perfil**, com nome e e-mail `ana@exemplo.com`.
4. Recarregue a página; o perfil continua aberto. Reinicie o servidor e recarregue: o cadastro e a sessão permanecem.
5. Clique em **Sair do perfil neste dispositivo**: abre o login. Tente uma senha incorreta e confira o erro. Use o e-mail e a senha correta para entrar novamente. Recarregue e confirme que permanece conectado.
6. Clique em **Criar outro cadastro neste dispositivo**; os campos ficam vazios. Cadastre `Bruno` com `bruno@exemplo.com` e senha: um segundo cadastro é salvo sem excluir Ana.
7. No perfil, clique em **Criar outro cadastro neste dispositivo**. Tente cadastrar novamente `Ana` com ` ANA@EXEMPLO.COM ` e uma senha válida: aparece exatamente **E-mail já cadastrado**.

Os testes em `server/registration.test.js` verificam HTTP, banco real temporário, unicidade, múltiplos usuários, normalização, encerramento de sessão e reabertura do banco. Os testes do formulário verificam validação no cliente, limpeza e mensagem de duplicidade.
