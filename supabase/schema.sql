-- ============================================================
-- Schéma Supabase — Tontine
-- À exécuter dans Supabase : Project > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---- Réglages de la tontine (une seule ligne) ----------------
create table if not exists tontine_settings (
  id int primary key default 1,
  name text not null default 'Tontine',
  motto text,
  amount numeric not null default 25000,
  currency text not null default 'FCFA',
  frequency text not null default 'Mensuelle',
  current_turn int not null default 1,
  total_turns int not null default 12,
  cycle_number int not null default 1,      -- 1er tour complet, 2ème, 3ème...
  constraint single_row check (id = 1)
);
insert into tontine_settings (id) values (1) on conflict (id) do nothing;

-- ---- Membres ---------------------------------------------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text,
  phone text,
  personal_code text not null unique,       -- code à 6 chiffres, donné en main propre
  turn_order int not null,                  -- position dans la rotation
  status text not null default 'upcoming',  -- paid | late | upcoming | current
  created_at timestamptz not null default now()
);

-- ---- Versements (historique, sert aussi à générer les reçus) ---
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  turn int not null,
  cycle int not null default 1,
  amount numeric not null,
  paid_at timestamptz not null default now()
);

-- ============================================================
-- Sécurité (Row Level Security)
-- ============================================================
alter table tontine_settings enable row level security;
alter table members enable row level security;
alter table payments enable row level security;

-- L'administrateur (utilisateur authentifié via Supabase Auth) a un accès complet.
create policy "admin full access settings" on tontine_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access members" on members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access payments" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Le rôle anonyme (public, non connecté) n'a AUCUN accès direct aux tables.
-- Les membres passent uniquement par les fonctions ci-dessous, qui vérifient
-- le code personnel côté serveur avant de renvoyer la moindre donnée.

-- Les versements (montant, tour, date, nom du membre) ne sont pas sensibles :
-- ils sont nécessaires pour que chaque membre (connecté par code, sans session
-- Supabase Auth) puisse consulter ses propres reçus.
create policy "public read payments" on payments
  for select using (true);

-- ---- Connexion d'un membre par code personnel -------------------
create or replace function verify_member_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  m members%rowtype;
begin
  select * into m from members where personal_code = p_code;
  if not found then
    return null;
  end if;
  return json_build_object(
    'id', m.id, 'name', m.name, 'initials', m.initials,
    'turn', m.turn_order, 'status', m.status
  );
end;
$$;

revoke all on function verify_member_code(text) from public;
grant execute on function verify_member_code(text) to anon;

-- ---- Lecture publique (sans code) des infos non sensibles ------
-- Utilisée pour afficher la roue de rotation et le calendrier à tout le monde,
-- sans exposer les codes personnels ni les téléphones.
create or replace view public_members as
  select id, name, initials, turn_order as turn, status from members order by turn_order;

grant select on public_members to anon, authenticated;

create or replace view public_tontine_settings as
  select name, motto, amount, currency, frequency, current_turn, total_turns, cycle_number from tontine_settings;

grant select on public_tontine_settings to anon, authenticated;
