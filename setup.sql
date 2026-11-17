-- Estrutura completa do banco (já aplicada no projeto). Use para recriar do zero.

create table public.tarefas (
  id        bigint generated always as identity primary key,
  titulo    text not null check (char_length(titulo) between 1 and 200),
  feita     boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.tarefas enable row level security;
revoke all on public.tarefas from anon; -- visitante sem login não acessa nada

-- Lista de administradores (um único usuário)
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon;
create policy "admin ve a si mesmo" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Só quem está em admins lê/cria/edita/apaga tarefas.
-- (select auth.uid()) entre parênteses: o Postgres calcula uma vez por consulta, não por linha.
create policy "somente admin" on public.tarefas
  for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Admin automático: a conta com ESTE e-mail, depois de confirmada, entra em admins.
-- Troque SEU_EMAIL pelo e-mail do admin antes de rodar.
create function public.vincular_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email = 'SEU_EMAIL' and new.email_confirmed_at is not null then
    insert into public.admins (user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;
revoke execute on function public.vincular_admin() from public, anon, authenticated;

create trigger vincular_admin
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.vincular_admin();
