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
- `server/routes.js`: POST `/api/usuarios`, GET e DELETE `/api/sessao`.
- `server/database.js`: consultas parametrizadas, tabela `usuarios` e sessões persistentes.
- `server/vite-plugin.js`: API Node integrada ao servidor Vite.

SQLite foi escolhido por dispensar serviço ou credenciais adicionais. O arquivo `data/learnai.sqlite` é criado automaticamente e fica fora do Git. Não apague esse arquivo; faça backup dele para preservar os cadastros. `DATABASE_PATH` permite escolher outro caminho persistente.
A tabela `usuarios` contém `id`, `nome`, `email` UNIQUE em minúsculas e `criado_em`. Cadastro e sessão são gravados em uma transação. Duplicidade retorna HTTP 409 e a mensagem exata `E-mail já cadastrado`.

O cookie HttpOnly identifica uma sessão de 30 dias, que sobrevive a recarga e reinício. Sair invalida a sessão no banco, sem excluir usuários. Criar outro cadastro encerra a sessão e abre o formulário vazio. Não há login posterior nem verificação de identidade por senha ou e-mail nesta F15.
O progresso de aprendizagem continua local. Nome e e-mail passam a ser persistidos no servidor; antigos cadastros exclusivos do localStorage não são migrados automaticamente.

Hospedagem estática (incluindo apenas publicar `dist`) não executa esta API. Para publicar, é necessário servidor Node com disco persistente, ou adaptar a API a um banco remoto. Em produção HTTPS, configure `NODE_ENV=production` para cookie Secure.

## Demonstração

1. Abra o site na branch indicada; pule o vídeo de abertura se necessário.
2. Preencha nome `Ana` e e-mail `invalido`. Clique em **Criar meu espaço**: aparece `Informe um e-mail válido.` e nada é salvo. Nome composto só por espaços também é bloqueado.
3. Use `Ana` e `ANA@EXEMPLO.COM`. Envie: aparece sucesso e abre **Seu perfil**, com nome e e-mail `ana@exemplo.com`.
4. Recarregue a página; o perfil continua aberto. Reinicie o servidor e recarregue: o cadastro e a sessão permanecem.
5. Clique em **Sair do perfil neste dispositivo**: volta ao formulário vazio. Recarregue e confirme que permanece fora do perfil.
6. Clique em **Criar outro cadastro neste dispositivo**; os campos ficam vazios. Cadastre `Bruno` com `bruno@exemplo.com`: um segundo cadastro é salvo sem excluir Ana.
7. No perfil, clique em **Criar outro cadastro neste dispositivo**. Tente cadastrar novamente `Ana` com ` ANA@EXEMPLO.COM `: aparece exatamente **E-mail já cadastrado**.

Os testes em `server/registration.test.js` verificam HTTP, banco real temporário, unicidade, múltiplos usuários, normalização, encerramento de sessão e reabertura do banco. Os testes do formulário verificam validação no cliente, limpeza e mensagem de duplicidade.
