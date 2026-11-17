# Supatasks

Lista de tarefas em HTML, CSS e JavaScript puro, com Supabase (Auth + Postgres + RLS). Só um administrador acessa.

## Como rodar

1. No Supabase, rode `setup.sql` no SQL Editor (troque `SEU_EMAIL` pelo e-mail do admin).
2. Em **Authentication > Users > Add user**, crie o admin com esse e-mail e marque *Auto Confirm User*.
3. Em **Authentication > Sign In / Providers**, desligue *Allow new users to sign up*.
4. Copie `config.example.js` para `config.js` e preencha a URL e a chave **publishable**.
5. Sirva a pasta: `python -m http.server 5173` e abra `http://localhost:5173`.

## Segurança

- A chave publishable é pública por natureza. Quem protege os dados é a RLS: sem login, o banco responde `permission denied`.
- Só usuários na tabela `admins` leem ou escrevem tarefas.
- `config.js` fica fora do git (`.gitignore`).
