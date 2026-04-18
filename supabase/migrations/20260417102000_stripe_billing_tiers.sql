alter type public.subscription_plan add value if not exists 'starter' after 'free';
alter type public.subscription_status add value if not exists 'trialing' after 'active';
alter type public.subscription_status add value if not exists 'canceled' after 'past_due';

alter table public.subscriptions
  add column if not exists extra_pack_quantity integer not null default 0 check (extra_pack_quantity >= 0),
  add column if not exists stripe_subscription_status text;

create or replace function public.calculate_participant_limit(
  p_plan public.subscription_plan,
  p_extra_pack_quantity integer default 0
)
returns integer
language sql
immutable
as $$
  select
    case
      when p_plan::text = 'starter' then 8
      when p_plan::text = 'pro' then 16
      else 4
    end + greatest(coalesce(p_extra_pack_quantity, 0), 0) * 4;
$$;

update public.subscriptions
set participant_limit = public.calculate_participant_limit(plan, extra_pack_quantity);

create or replace function app_private.sync_subscription_limit(target_host_user_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record public.subscriptions%rowtype;
  resolved_limit integer;
begin
  select *
  into subscription_record
  from public.subscriptions
  where host_user_id = target_host_user_id
  for update;

  if not found then
    insert into public.subscriptions (
      host_user_id,
      plan,
      status,
      participant_limit,
      extra_pack_quantity
    )
    values (
      target_host_user_id,
      'free',
      'inactive',
      public.calculate_participant_limit('free', 0),
      0
    )
    returning * into subscription_record;
  end if;

  resolved_limit := public.calculate_participant_limit(
    subscription_record.plan,
    subscription_record.extra_pack_quantity
  );

  if subscription_record.participant_limit <> resolved_limit then
    update public.subscriptions
    set participant_limit = resolved_limit,
        updated_at = timezone('utc', now())
    where host_user_id = target_host_user_id
    returning * into subscription_record;
  end if;

  return subscription_record;
end;
$$;

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

  insert into public.subscriptions (
    host_user_id,
    plan,
    status,
    participant_limit,
    extra_pack_quantity
  )
  values (
    new.id,
    'free',
    'inactive',
    public.calculate_participant_limit('free', 0),
    0
  )
  on conflict (host_user_id) do nothing;

  return new;
end;
$$;

update public.subscriptions
set extra_pack_quantity = 0
where extra_pack_quantity is null;

insert into public.subscriptions (
  host_user_id,
  plan,
  status,
  participant_limit,
  extra_pack_quantity
)
select
  profiles.id,
  'free',
  'inactive',
  public.calculate_participant_limit('free', 0),
  0
from public.profiles as profiles
on conflict (host_user_id) do nothing;

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
  resolved_participant_limit integer;
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
  from app_private.sync_subscription_limit(room_record.host_user_id);

  resolved_participant_limit := public.calculate_participant_limit(
    subscription_record.plan,
    subscription_record.extra_pack_quantity
  );

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
      'participantLimit', resolved_participant_limit,
      'extraPackQuantity', subscription_record.extra_pack_quantity
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
    'participantLimit', public.calculate_participant_limit(
      subscriptions.plan,
      subscriptions.extra_pack_quantity
    ),
    'extraPackQuantity', subscriptions.extra_pack_quantity,
    'stripeCustomerId', subscriptions.stripe_customer_id,
    'stripeSubscriptionId', subscriptions.stripe_subscription_id,
    'stripeSubscriptionStatus', subscriptions.stripe_subscription_status,
    'lastUpdatedAt', greatest(profiles.updated_at, subscriptions.updated_at)
  )
  from public.profiles
  join public.subscriptions
    on subscriptions.host_user_id = profiles.id
  where profiles.id = auth.uid();
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

  perform app_private.sync_subscription_limit(auth.uid());

  insert into public.rooms (host_user_id)
  values (auth.uid())
  returning id into new_room_id;

  return app_private.room_snapshot(new_room_id);
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
    public.calculate_participant_limit(
      subscriptions.plan,
      subscriptions.extra_pack_quantity
    ) as participant_limit
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
    raise exception 'このルームは % 人までです。Starter / Pro / Extra Pack で上限を引き上げてください。', room_record.participant_limit;
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
