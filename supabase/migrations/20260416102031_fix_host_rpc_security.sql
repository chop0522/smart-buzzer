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
