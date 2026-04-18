create table if not exists public.processed_stripe_events (
  event_id text primary key,
  event_type text not null,
  status text not null check (status in ('processing', 'completed', 'failed')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  processing_started_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_processed_stripe_events_updated_at on public.processed_stripe_events;

create trigger set_processed_stripe_events_updated_at
before update on public.processed_stripe_events
for each row execute function public.set_updated_at();

create or replace function public.claim_stripe_event(
  p_event_id text,
  p_event_type text,
  p_stale_after_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_event public.processed_stripe_events%rowtype;
  stale_after interval := make_interval(
    secs => greatest(coalesce(p_stale_after_seconds, 300), 30)
  );
begin
  if coalesce(trim(p_event_id), '') = '' then
    raise exception 'Stripe event id is required.';
  end if;

  if coalesce(trim(p_event_type), '') = '' then
    raise exception 'Stripe event type is required.';
  end if;

  insert into public.processed_stripe_events (
    event_id,
    event_type,
    status,
    attempt_count,
    processing_started_at,
    processed_at,
    last_error
  )
  values (
    p_event_id,
    p_event_type,
    'processing',
    1,
    timezone('utc', now()),
    null,
    null
  )
  on conflict (event_id) do nothing;

  if found then
    return true;
  end if;

  select *
  into existing_event
  from public.processed_stripe_events
  where event_id = p_event_id
  for update;

  if existing_event.status = 'completed' then
    update public.processed_stripe_events
    set event_type = p_event_type,
        attempt_count = existing_event.attempt_count + 1
    where event_id = p_event_id;

    return false;
  end if;

  if existing_event.status = 'processing'
     and existing_event.processing_started_at >= timezone('utc', now()) - stale_after then
    update public.processed_stripe_events
    set event_type = p_event_type,
        attempt_count = existing_event.attempt_count + 1
    where event_id = p_event_id;

    return false;
  end if;

  update public.processed_stripe_events
  set event_type = p_event_type,
      status = 'processing',
      attempt_count = existing_event.attempt_count + 1,
      processing_started_at = timezone('utc', now()),
      processed_at = null,
      last_error = null
  where event_id = p_event_id;

  return true;
end;
$$;

create or replace function public.complete_stripe_event(p_event_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.processed_stripe_events
  set status = 'completed',
      processed_at = timezone('utc', now()),
      last_error = null
  where event_id = p_event_id;
end;
$$;

create or replace function public.fail_stripe_event(
  p_event_id text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.processed_stripe_events
  set status = 'failed',
      processed_at = null,
      last_error = left(coalesce(p_error, 'Stripe webhook failed.'), 1000)
  where event_id = p_event_id;
end;
$$;

alter table public.processed_stripe_events enable row level security;

revoke all on public.processed_stripe_events from public;
grant select, insert, update on public.processed_stripe_events to service_role;

revoke all on function public.claim_stripe_event(text, text, integer) from public;
grant execute on function public.claim_stripe_event(text, text, integer) to service_role;

revoke all on function public.complete_stripe_event(text) from public;
grant execute on function public.complete_stripe_event(text) to service_role;

revoke all on function public.fail_stripe_event(text, text) from public;
grant execute on function public.fail_stripe_event(text, text) to service_role;
