create extension if not exists pgcrypto;

create type public.subscription_plan as enum ('free', 'pro');
create type public.subscription_status as enum ('inactive', 'active', 'past_due');
create type public.round_status as enum ('idle', 'open', 'closed');
create type public.participant_result as enum ('waiting', 'first', 'second', 'locked_out');

create schema if not exists app_private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function app_private.generate_room_code()
returns text
language plpgsql
as $$
declare
  chars text[] := array[
    'A','B','C','D','E','F','G','H','J','K','L','M',
    'N','P','Q','R','S','T','U','V','W','X','Y','Z',
    '2','3','4','5','6','7','8','9'
  ];
  next_code text;
begin
  loop
    next_code := '';
    for i in 1..6 loop
      next_code := next_code || chars[1 + floor(random() * array_length(chars, 1))::int];
    end loop;

    exit when not exists (
      select 1
      from public.rooms
      where code = next_code
    );
  end loop;

  return next_code;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'inactive',
  participant_limit integer not null default 4 check (participant_limit >= 1),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique default app_private.generate_room_code() check (code ~ '^[A-Z2-9]{6}$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 30),
  joined_at timestamptz not null default timezone('utc', now()),
  last_result public.participant_result not null default 'waiting'
);

create unique index participants_room_name_lower_key
  on public.participants (room_id, lower(name));

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  round_number integer not null check (round_number > 0),
  status public.round_status not null default 'idle',
  started_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, round_number)
);

create index rounds_room_id_round_number_idx
  on public.rounds (room_id, round_number desc);

create table public.buzz_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  round_id uuid not null references public.rounds (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  rank smallint check (rank in (1, 2) or rank is null),
  outcome public.participant_result not null,
  server_received_at timestamptz not null default timezone('utc', now()),
  unique (round_id, participant_id)
);

create index buzz_events_round_rank_idx
  on public.buzz_events (round_id, rank, server_received_at);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create trigger set_rounds_updated_at
before update on public.rounds
for each row execute function public.set_updated_at();

create or replace function public.handle_new_host_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, 'host@example.com'), '@', 1),
      'Host'
    )
  )
  on conflict (id) do update
    set email = excluded.email;

  insert into public.subscriptions (host_user_id, plan, status, participant_limit)
  values (new.id, 'free', 'inactive', 4)
  on conflict (host_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_host_user();

insert into public.profiles (id, email, display_name)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(
    users.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(users.email, 'host@example.com'), '@', 1),
    'Host'
  )
from auth.users as users
on conflict (id) do nothing;

insert into public.subscriptions (host_user_id, plan, status, participant_limit)
select profiles.id, 'free', 'inactive', 4
from public.profiles as profiles
on conflict (host_user_id) do nothing;

create or replace function app_private.is_owner_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_user_id = auth.uid();
$$;

create or replace function app_private.is_room_owner(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms
    where id = target_room_id
      and host_user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.rounds enable row level security;
alter table public.buzz_events enable row level security;

create policy "hosts can read own profile"
on public.profiles
for select
to authenticated
using (app_private.is_owner_profile(id));

create policy "hosts can update own profile"
on public.profiles
for update
to authenticated
using (app_private.is_owner_profile(id))
with check (app_private.is_owner_profile(id));

create policy "hosts can read own subscription"
on public.subscriptions
for select
to authenticated
using (app_private.is_owner_profile(host_user_id));

create policy "hosts can manage own rooms"
on public.rooms
for all
to authenticated
using (app_private.is_owner_profile(host_user_id))
with check (app_private.is_owner_profile(host_user_id));

create policy "hosts can manage participants in own rooms"
on public.participants
for all
to authenticated
using (app_private.is_room_owner(room_id))
with check (app_private.is_room_owner(room_id));

create policy "hosts can manage rounds in own rooms"
on public.rounds
for all
to authenticated
using (app_private.is_room_owner(room_id))
with check (app_private.is_room_owner(room_id));

create policy "hosts can read buzz events in own rooms"
on public.buzz_events
for select
to authenticated
using (app_private.is_room_owner(room_id));

create or replace function app_private.create_initial_round()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rounds (room_id, round_number, status)
  values (new.id, 1, 'idle');

  return new;
end;
$$;

drop trigger if exists on_room_created on public.rooms;
create trigger on_room_created
after insert on public.rooms
for each row execute function app_private.create_initial_round();

create or replace function app_private.room_snapshot(target_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_record public.rooms%rowtype;
  profile_record public.profiles%rowtype;
  subscription_record public.subscriptions%rowtype;
  latest_round public.rounds%rowtype;
  participants_json jsonb;
  winners_json jsonb;
begin
  select *
  into room_record
  from public.rooms
  where id = target_room_id;

  if not found then
    return null;
  end if;

  select *
  into profile_record
  from public.profiles
  where id = room_record.host_user_id;

  select *
  into subscription_record
  from public.subscriptions
  where host_user_id = room_record.host_user_id;

  select *
  into latest_round
  from public.rounds
  where room_id = target_room_id
  order by round_number desc
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', participants.id,
        'name', participants.name,
        'joinedAt', participants.joined_at,
        'lastResult', participants.last_result
      )
      order by participants.joined_at
    ),
    '[]'::jsonb
  )
  into participants_json
  from public.participants
  where room_id = target_room_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'participantId', buzz_events.participant_id,
        'name', participants.name,
        'rank', buzz_events.rank,
        'serverReceivedAt', buzz_events.server_received_at
      )
      order by buzz_events.rank, buzz_events.server_received_at
    ),
    '[]'::jsonb
  )
  into winners_json
  from public.buzz_events
  join public.participants
    on participants.id = buzz_events.participant_id
  where buzz_events.room_id = target_room_id
    and buzz_events.round_id = latest_round.id
    and buzz_events.rank is not null;

  return jsonb_build_object(
    'code', room_record.code,
    'hostId', profile_record.id,
    'hostName', profile_record.display_name,
    'createdAt', room_record.created_at,
    'updatedAt', room_record.updated_at,
    'subscription', jsonb_build_object(
      'plan', subscription_record.plan,
      'status', subscription_record.status,
      'participantLimit', subscription_record.participant_limit
    ),
    'participants', participants_json,
    'round', jsonb_build_object(
      'id', coalesce(latest_round.round_number, 1),
      'status', coalesce(latest_round.status, 'idle'),
      'startedAt', latest_round.started_at,
      'closedAt', latest_round.closed_at,
      'winners', winners_json
    )
  );
end;
$$;

create or replace function public.get_host_account()
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'hostId', profiles.id,
    'displayName', profiles.display_name,
    'plan', subscriptions.plan,
    'status', subscriptions.status,
    'participantLimit', subscriptions.participant_limit,
    'stripeCustomerId', subscriptions.stripe_customer_id,
    'stripeSubscriptionId', subscriptions.stripe_subscription_id,
    'lastUpdatedAt', greatest(profiles.updated_at, subscriptions.updated_at)
  )
  from public.profiles
  join public.subscriptions
    on subscriptions.host_user_id = profiles.id
  where profiles.id = auth.uid();
$$;

create or replace function public.list_host_rooms()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(app_private.room_snapshot(rooms.id) order by rooms.updated_at desc),
    '[]'::jsonb
  )
  from public.rooms
  where rooms.host_user_id = auth.uid();
$$;

create or replace function public.get_room_snapshot(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room_id uuid;
begin
  select id
  into target_room_id
  from public.rooms
  where upper(code) = upper(trim(p_room_code));

  if not found then
    return null;
  end if;

  return app_private.room_snapshot(target_room_id);
end;
$$;

create or replace function public.create_room()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'ホストログインが必要です。';
  end if;

  insert into public.rooms (host_user_id)
  values (auth.uid())
  returning id into new_room_id;

  return app_private.room_snapshot(new_room_id);
end;
$$;

create or replace function public.start_room_round(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_record public.rooms%rowtype;
  latest_round public.rounds%rowtype;
  next_round_number integer;
  snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'ホストログインが必要です。';
  end if;

  select *
  into room_record
  from public.rooms
  where upper(code) = upper(trim(p_room_code))
    and host_user_id = auth.uid()
  for update;

  if not found then
    raise exception '操作対象のルームが見つかりません。';
  end if;

  select *
  into latest_round
  from public.rounds
  where room_id = room_record.id
  order by round_number desc
  limit 1
  for update;

  if latest_round.status = 'open' then
    raise exception '現在のラウンドはすでに開始中です。';
  end if;

  update public.participants
  set last_result = 'waiting'
  where room_id = room_record.id;

  if latest_round.status = 'idle'
     and latest_round.started_at is null
     and not exists (
       select 1
       from public.buzz_events
       where round_id = latest_round.id
     ) then
    update public.rounds
    set status = 'open',
        started_at = timezone('utc', now()),
        closed_at = null
    where id = latest_round.id;
  else
    next_round_number := coalesce(latest_round.round_number, 0) + 1;
    insert into public.rounds (room_id, round_number, status, started_at)
    values (room_record.id, next_round_number, 'open', timezone('utc', now()));
  end if;

  update public.rooms
  set updated_at = timezone('utc', now())
  where id = room_record.id;

  snapshot := app_private.room_snapshot(room_record.id);
  perform realtime.send(snapshot, 'room.sync', 'room:' || room_record.code, false);

  return snapshot;
end;
$$;

create or replace function public.reset_room_round(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_record public.rooms%rowtype;
  latest_round public.rounds%rowtype;
  next_round_number integer;
  snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'ホストログインが必要です。';
  end if;

  select *
  into room_record
  from public.rooms
  where upper(code) = upper(trim(p_room_code))
    and host_user_id = auth.uid()
  for update;

  if not found then
    raise exception '操作対象のルームが見つかりません。';
  end if;

  select *
  into latest_round
  from public.rounds
  where room_id = room_record.id
  order by round_number desc
  limit 1;

  next_round_number := coalesce(latest_round.round_number, 0) + 1;

  insert into public.rounds (room_id, round_number, status)
  values (room_record.id, next_round_number, 'idle');

  update public.participants
  set last_result = 'waiting'
  where room_id = room_record.id;

  update public.rooms
  set updated_at = timezone('utc', now())
  where id = room_record.id;

  snapshot := app_private.room_snapshot(room_record.id);
  perform realtime.send(snapshot, 'room.sync', 'room:' || room_record.code, false);

  return snapshot;
end;
$$;

create or replace function public.join_room(p_room_code text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed_name text := trim(p_name);
  room_record record;
  current_count integer;
  participant_row public.participants%rowtype;
  snapshot jsonb;
begin
  if char_length(trimmed_name) < 2 then
    raise exception '参加者名は2文字以上で入力してください。';
  end if;

  select
    rooms.id,
    rooms.code,
    subscriptions.participant_limit
  into room_record
  from public.rooms
  join public.subscriptions
    on subscriptions.host_user_id = rooms.host_user_id
  where upper(rooms.code) = upper(trim(p_room_code))
  for update;

  if not found then
    raise exception 'ルームが見つかりません。';
  end if;

  select count(*)
  into current_count
  from public.participants
  where room_id = room_record.id;

  if current_count >= room_record.participant_limit then
    raise exception 'このルームは % 人までです。課金状態はサーバー側で検証されています。', room_record.participant_limit;
  end if;

  if exists (
    select 1
    from public.participants
    where room_id = room_record.id
      and lower(name) = lower(trimmed_name)
  ) then
    raise exception '同じ名前の参加者がすでにいます。';
  end if;

  insert into public.participants (room_id, name)
  values (room_record.id, trimmed_name)
  returning * into participant_row;

  update public.rooms
  set updated_at = timezone('utc', now())
  where id = room_record.id;

  snapshot := app_private.room_snapshot(room_record.id);
  perform realtime.send(snapshot, 'room.sync', 'room:' || room_record.code, false);

  return jsonb_build_object(
    'participant', jsonb_build_object(
      'id', participant_row.id,
      'name', participant_row.name,
      'joinedAt', participant_row.joined_at,
      'lastResult', participant_row.last_result
    ),
    'room', snapshot
  );
end;
$$;

create or replace function public.submit_buzz(p_room_code text, p_participant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  room_record public.rooms%rowtype;
  latest_round public.rounds%rowtype;
  participant_row public.participants%rowtype;
  winner_count integer;
  assigned_rank integer;
  next_outcome public.participant_result;
  received_at timestamptz := timezone('utc', now());
  snapshot jsonb;
begin
  select *
  into room_record
  from public.rooms
  where upper(code) = upper(trim(p_room_code))
  for update;

  if not found then
    raise exception 'ルームが見つかりません。';
  end if;

  select *
  into latest_round
  from public.rounds
  where room_id = room_record.id
  order by round_number desc
  limit 1
  for update;

  if not found or latest_round.status <> 'open' then
    raise exception '現在のラウンドは受付中ではありません。';
  end if;

  select *
  into participant_row
  from public.participants
  where id = p_participant_id
    and room_id = room_record.id;

  if not found then
    raise exception '参加者が見つかりません。';
  end if;

  if exists (
    select 1
    from public.buzz_events
    where round_id = latest_round.id
      and participant_id = participant_row.id
  ) then
    raise exception 'この参加者はすでに回答済みです。';
  end if;

  select count(*)
  into winner_count
  from public.buzz_events
  where round_id = latest_round.id
    and rank is not null;

  assigned_rank := case when winner_count < 2 then winner_count + 1 else null end;
  next_outcome := case
    when assigned_rank = 1 then 'first'
    when assigned_rank = 2 then 'second'
    else 'locked_out'
  end;

  insert into public.buzz_events (
    room_id,
    round_id,
    participant_id,
    rank,
    outcome,
    server_received_at
  )
  values (
    room_record.id,
    latest_round.id,
    participant_row.id,
    assigned_rank,
    next_outcome,
    received_at
  );

  update public.participants
  set last_result = next_outcome
  where id = participant_row.id;

  if assigned_rank = 2 then
    update public.rounds
    set status = 'closed',
        closed_at = received_at
    where id = latest_round.id;

    update public.participants
    set last_result = 'locked_out'
    where room_id = room_record.id
      and id not in (
        select participant_id
        from public.buzz_events
        where round_id = latest_round.id
          and rank is not null
      );
  elsif assigned_rank is null then
    update public.rounds
    set status = 'closed',
        closed_at = coalesce(closed_at, received_at)
    where id = latest_round.id;
  end if;

  update public.rooms
  set updated_at = received_at
  where id = room_record.id;

  snapshot := app_private.room_snapshot(room_record.id);
  perform realtime.send(snapshot, 'room.sync', 'room:' || room_record.code, false);

  return jsonb_build_object(
    'outcome', next_outcome,
    'room', snapshot
  );
end;
$$;

grant execute on function public.get_host_account() to authenticated;
grant execute on function public.list_host_rooms() to authenticated;
grant execute on function public.create_room() to authenticated;
grant execute on function public.start_room_round(text) to authenticated;
grant execute on function public.reset_room_round(text) to authenticated;

grant execute on function public.get_room_snapshot(text) to anon, authenticated;
grant execute on function public.join_room(text, text) to anon, authenticated;
grant execute on function public.submit_buzz(text, uuid) to anon, authenticated;
