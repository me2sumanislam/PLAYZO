 -- =====================================================================
-- PLAYZO — MongoDB → Supabase (PostgreSQL) Schema
-- Converted from mongoose models: User, Admin, Deposit, Withdraw, Match,
-- LudoTournament, LudoResultSubmission, ResultSubmission, Notification,
-- UserNotification, PushSubscription, PaymentNumber, ActivityLog,
-- PointConvertRequest
--
-- NOTES:
-- 1) Mongo ObjectId → uuid (default gen_random_uuid()). pgcrypto extension
--    needed for gen_random_uuid() (Supabase enables this by default).
-- 2) Nested mongoose arrays (transactions[], referralHistory[], joinHistory[],
--    joinedUsers[], results[], finalPlayers[]) → separate child tables with
--    a foreign key back to the parent, since Postgres is relational.
-- 3) `admins` table structure is ASSUMED (the actual models/Admin.js file
--    was not in the uploaded code) — adjust columns if your real schema
--    differs. Based on usage in admin.js it needs at least: name, phone,
--    password, role.
-- 4) Money fields use NUMERIC(12,2) instead of JS Number to avoid floating
--    point rounding issues with currency — recommended even though Mongo
--    used plain Number.
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- USERS
-- =====================================================================
create table users (
  id                  uuid primary key default gen_random_uuid(),
  name                text default '',
  in_game_name        text default '',
  email               text default '',
  phone               text not null unique,
  password            text not null,                -- keep bcrypt hash; or migrate to Supabase Auth
  role                text not null default 'user'
                        check (role in ('user','admin','super-admin','finance')),
  balance             numeric(12,2) not null default 0,
  total_deposit       numeric(12,2) not null default 0,   -- used in admin.js $inc, missing from model but referenced
  total_withdraw      numeric(12,2) not null default 0,   -- same
  total_matches_played integer not null default 0,
  total_wins          integer not null default 0,
  is_blocked          boolean not null default false,
  last_login          timestamptz,

  -- Referral system
  referral_code       text unique,
  referred_by         uuid references users(id) on delete set null,
  referral_points     numeric(12,2) not null default 0,
  referral_count      integer not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_users_referred_by on users(referred_by);

-- =====================================================================
-- ADMINS (assumed structure — see note above)
-- =====================================================================
create table admins (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null unique,
  password    text not null,
  role        text not null default 'admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- USER.transactions[]  → transactions
-- =====================================================================
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text,
  amount      numeric(12,2),
  match_id    uuid,               -- FK added after matches table is created (below)
  match_title text,
  txn_date    timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index idx_transactions_user_id on transactions(user_id);

-- =====================================================================
-- USER.referralHistory[]  → referral_history
-- =====================================================================
create table referral_history (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references users(id) on delete cascade,
  referred_user_id uuid references users(id) on delete set null,
  name         text,
  phone        text,
  deposited    boolean not null default false,
  point_given  boolean not null default false,
  joined_at    timestamptz not null default now()
);

create index idx_referral_history_referrer on referral_history(referrer_id);

-- =====================================================================
-- USER.joinHistory[]  → match_join_history
-- =====================================================================
create table match_join_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  match_id    uuid,               -- FK added after matches table (below)
  match_title text,
  entry_fee   numeric(12,2),
  joined_at   timestamptz not null default now()
);

create index idx_match_join_history_user on match_join_history(user_id);

-- =====================================================================
-- DEPOSITS
-- =====================================================================
create table deposits (
  id             uuid primary key default gen_random_uuid(),
  method         text not null check (method in ('bkash','nagad','rocket')),
  amount         numeric(12,2) not null check (amount >= 1),
  trx_id         text not null,
  payment_number text,
  user_id        uuid references users(id) on delete set null,
  status         text not null default 'pending'
                   check (status in ('pending','approved','rejected')),
  approved_by    text,
  rejected_by    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_deposits_user_id on deposits(user_id);
create index idx_deposits_status on deposits(status);

-- =====================================================================
-- WITHDRAWS
-- =====================================================================
create table withdraws (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  amount      numeric(12,2) not null,
  method      text not null check (method in ('bKash','Nagad','Rocket')),
  account_no  text not null,
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  trx_id      text,
  note        text,
  approved_by text,
  rejected_by text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_withdraws_user_id on withdraws(user_id);
create index idx_withdraws_status on withdraws(status);

-- =====================================================================
-- MATCHES
-- =====================================================================
create table matches (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  category              text not null,
  match_type            text not null default 'solo' check (match_type in ('solo','team')),
  team_size             integer not null default 1,

  entry_fee             numeric(12,2) not null default 0,
  win_prize             numeric(12,2) not null default 0,

  prize_first           numeric(12,2) default 0,
  prize_second          numeric(12,2) default 0,
  prize_third           numeric(12,2) default 0,
  prize_fourth          numeric(12,2) default 0,

  per_kill              numeric(12,2) default 0,
  prize_pool            numeric(12,2) default 0,

  map                   text default 'Bermuda',
  device                text default 'Mobile',
  image                 text default '',

  start_time            timestamptz,

  total_players         integer default 48,
  joined_players        integer default 0,

  room_id               text default '',
  room_password         text default '',
  is_room_open          boolean default false,

  winner_team           text default '',
  result_submission_id  uuid,   -- FK added after result_submissions table

  completed_at          timestamptz,
  delete_at             timestamptz,
  status                text default 'upcoming',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- now that matches exists, backfill FKs on earlier tables
alter table transactions
  add constraint fk_transactions_match foreign key (match_id) references matches(id) on delete set null;
alter table match_join_history
  add constraint fk_join_history_match foreign key (match_id) references matches(id) on delete set null;

-- ── Match.joinedUsers[] → match_participants ──────────────────────────
create table match_participants (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references matches(id) on delete cascade,
  user_id      uuid references users(id) on delete set null,
  in_game_name text default '',
  game_name    text default '',
  slot_number  integer,
  team         text default 'A',
  joined_at    timestamptz not null default now()
);

create index idx_match_participants_match on match_participants(match_id);
create index idx_match_participants_user on match_participants(user_id);

-- ── Match.results[] → match_results ───────────────────────────────────
create table match_results (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references matches(id) on delete cascade,
  user_id      uuid references users(id) on delete set null,
  in_game_name text,
  position     integer,
  kills        integer default 0,
  prize        numeric(12,2) default 0,
  rank         integer,
  team         text
);

create index idx_match_results_match on match_results(match_id);

-- =====================================================================
-- LUDO TOURNAMENTS
-- =====================================================================
create table ludo_tournaments (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  mode           text default '4player' check (mode in ('1v1','2v2','4player')),

  entry_fee      numeric(12,2) default 0,
  win_prize      numeric(12,2) default 0,

  total_slots    integer default 4,
  joined_players integer default 0,

  room_code      text default '',
  is_room_open   boolean default false,

  map            text default 'Classic',
  device         text default 'Mobile',
  image          text default '',

  status         text default 'upcoming' check (status in ('upcoming','live','completed','cancelled')),
  start_time     timestamptz,
  expires_at     timestamptz,

  winning_team   text default '',

  prize_first    numeric(12,2) default 0,
  prize_second   numeric(12,2) default 0,
  prize_third    numeric(12,2) default 0,
  prize_fourth   numeric(12,2) default 0,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Mongo TTL index (expireAfterSeconds:0) has no direct Postgres equivalent.
-- Use a pg_cron job or Supabase scheduled Edge Function to delete/archive
-- rows where expires_at < now().

-- ── LudoTournament.joinedUsers[] → ludo_participants ──────────────────
create table ludo_participants (
  id           uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references ludo_tournaments(id) on delete cascade,
  user_id      uuid references users(id) on delete set null,
  slot_number  integer,
  in_game_name text default '',
  team_id      text default ''
);

create index idx_ludo_participants_tournament on ludo_participants(tournament_id);

-- ── LudoTournament.results[] → ludo_results ────────────────────────────
create table ludo_results (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references ludo_tournaments(id) on delete cascade,
  user_id       uuid references users(id) on delete set null,
  rank          integer,
  prize         numeric(12,2) default 0,
  kills         integer default 0
);

create index idx_ludo_results_tournament on ludo_results(tournament_id);

-- =====================================================================
-- RESULT SUBMISSIONS (Battle Royale matches)
-- =====================================================================
create table result_submissions (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references matches(id) on delete cascade,
  submitted_by   uuid not null references users(id) on delete set null,
  screenshot_url text not null,
  screenshot_public_id text not null,
  status         text default 'pending_review'
                   check (status in ('processing','pending_review','approved','rejected','published')),
  admin_note     text default '',
  reviewed_by    uuid references users(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table matches
  add constraint fk_matches_result_submission foreign key (result_submission_id)
    references result_submissions(id) on delete set null;

-- ── ResultSubmission.finalPlayers[] → result_submission_players ───────
create table result_submission_players (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references result_submissions(id) on delete cascade,
  in_game_name    text,
  kills           integer,
  prize_awarded   numeric(12,2),
  position        integer
);

create index idx_rs_players_submission on result_submission_players(submission_id);

-- =====================================================================
-- LUDO RESULT SUBMISSIONS
-- =====================================================================
create table ludo_result_submissions (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references ludo_tournaments(id) on delete cascade,
  submitted_by   uuid not null references users(id) on delete set null,
  screenshot_url text not null,
  screenshot_public_id text not null,
  status         text default 'pending_review'
                   check (status in ('pending_review','approved','rejected','published')),
  admin_note     text default '',
  reviewed_by    uuid references users(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (match_id, submitted_by)   -- one screenshot per user per tournament
);

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  match_id   uuid references matches(id) on delete set null,
  category   text default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_notifications (
  id              uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_user_notifications_user_read on user_notifications(user_id, is_read);
create index idx_user_notifications_user_created on user_notifications(user_id, created_at desc);

-- =====================================================================
-- PUSH SUBSCRIPTIONS
-- =====================================================================
create table push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  endpoint     text not null unique,
  user_id      uuid references users(id) on delete set null,
  subscription jsonb not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_push_subscriptions_user on push_subscriptions(user_id);

-- =====================================================================
-- PAYMENT NUMBERS
-- =====================================================================
create table payment_numbers (
  id         uuid primary key default gen_random_uuid(),
  method     text not null check (method in ('bkash','nagad','rocket')),
  number     text not null,
  "limit"    numeric(12,2),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- ACTIVITY LOG
-- =====================================================================
create table activity_logs (
  id         uuid primary key default gen_random_uuid(),
  admin_name text,
  action     text,
  target     text,
  type       text check (type in ('approve','reject','create','ban','login')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- POINT CONVERT REQUESTS
-- =====================================================================
create table point_convert_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  points      numeric(12,2) not null,
  taka        numeric(12,2) not null,
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  admin_note  text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- updated_at auto-touch trigger (applies to every table that has the column)
-- =====================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where column_name = 'updated_at' and table_schema = 'public'
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- =====================================================================
-- CRITICAL: atomic balance operations (replaces Mongo's $inc atomicity)
-- Use these RPC functions from your backend instead of plain UPDATEs,
-- and wrap multi-step flows (approve deposit -> credit balance -> set
-- referral flag) in a single Postgres function so it's all-or-nothing.
-- =====================================================================

-- Generic safe balance increment/decrement
create or replace function adjust_user_balance(p_user_id uuid, p_amount numeric)
returns numeric as $$
declare new_balance numeric;
begin
  update users
    set balance = balance + p_amount
    where id = p_user_id
    returning balance into new_balance;

  if new_balance is null then
    raise exception 'User % not found', p_user_id;
  end if;

  if new_balance < 0 then
    raise exception 'Insufficient balance for user %', p_user_id;
  end if;

  return new_balance;
end;
$$ language plpgsql;

-- Approve deposit: credit balance + update totals + flip referral flag,
-- all inside one transaction (mirrors your admin.js /deposits/:id/approve).
create or replace function approve_deposit(p_deposit_id uuid, p_admin_name text)
returns void as $$
declare
  dep deposits;
  ref_min numeric := 100;   -- REFERRAL_DEPOSIT_MIN — set to your real constant
begin
  select * into dep from deposits where id = p_deposit_id for update;

  if dep is null then
    raise exception 'Deposit not found';
  end if;
  if dep.status <> 'pending' then
    raise exception 'Already processed';
  end if;

  update deposits
    set status = 'approved', approved_by = p_admin_name, updated_at = now()
    where id = p_deposit_id;

  update users
    set balance = balance + dep.amount,
        total_deposit = total_deposit + dep.amount
    where id = dep.user_id;

  -- referral flag: first-time deposit only
  if dep.amount >= ref_min then
    update referral_history
      set deposited = true
      where referred_user_id = dep.user_id
        and deposited = false;
  end if;
end;
$$ language plpgsql;

-- Approve withdraw: check balance, deduct, update totals — atomic.
create or replace function approve_withdraw(p_withdraw_id uuid, p_admin_name text)
returns void as $$
declare
  w withdraws;
  current_balance numeric;
begin
  select * into w from withdraws where id = p_withdraw_id for update;

  if w is null then
    raise exception 'Withdraw not found';
  end if;
  if w.status <> 'pending' then
    raise exception 'Already processed';
  end if;

  select balance into current_balance from users where id = w.user_id for update;

  if current_balance < w.amount then
    raise exception 'User has insufficient balance';
  end if;

  update withdraws
    set status = 'approved', approved_by = p_admin_name, updated_at = now()
    where id = p_withdraw_id;

  update users
    set balance = balance - w.amount,
        total_withdraw = total_withdraw + w.amount
    where id = w.user_id;
end;
$$ language plpgsql;

-- =====================================================================
-- ROW LEVEL SECURITY (enable + baseline policies)
-- Adjust to match how you authenticate (Supabase Auth vs your own JWT).
-- If you keep your own JWT (not Supabase Auth), RLS with auth.uid() won't
-- apply automatically — you'd enforce access in your Express layer instead,
-- or migrate login to Supabase Auth to get RLS "for free".
-- =====================================================================
alter table users enable row level security;
alter table deposits enable row level security;
alter table withdraws enable row level security;
alter table transactions enable row level security;

-- Example (only meaningful if using Supabase Auth, where auth.uid() = users.id):
-- create policy "Users can view own row" on users
--   for select using (auth.uid() = id);
-- create policy "Users can view own deposits" on deposits
--   for select using (auth.uid() = user_id);