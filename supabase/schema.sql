-- ─────────────────────────────────────────────────────────────
--  LIVRE.IO — Schéma Supabase
--  À coller dans Supabase > SQL Editor > New query > Run.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.pages (
  id                uuid primary key default gen_random_uuid(),
  page_number       int unique not null,
  content_type      text check (content_type in ('citation', 'histoire')),
  content_text      text,
  author_signature  text,
  is_paid           boolean not null default false,

  -- Concurrence : réservation temporaire pendant le paiement (10 min).
  -- Ces deux colonnes ne sont pas dans le cahier des charges d'origine
  -- mais sont nécessaires pour le point "Sécurité & Concurrence".
  reserved_until    timestamptz,
  stripe_session_id text,

  created_at        timestamptz not null default now()
);

-- Index pour retrouver vite une page par son numéro.
create index if not exists pages_page_number_idx on public.pages (page_number);

-- ─────────────────────────────────────────────────────────────
--  Row Level Security (RLS)
--  Le navigateur (clé anon) ne peut LIRE que les pages publiées.
--  Toute écriture passe par le serveur (clé service_role) qui
--  ignore la RLS.
-- ─────────────────────────────────────────────────────────────
alter table public.pages enable row level security;

-- Lecture publique des pages déjà payées ET rédigées.
drop policy if exists "lecture pages publiees" on public.pages;
create policy "lecture pages publiees"
  on public.pages
  for select
  to anon
  using (is_paid = true and content_text is not null);
