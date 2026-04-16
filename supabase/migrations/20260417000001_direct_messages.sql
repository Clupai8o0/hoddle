-- Direct messaging: conversations + messages
-- Apply with: npx supabase db push

-- Extend notification_type enum
alter type public.notification_type add value if not exists 'new_chat_message';

-- conversations table
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  participant_one uuid not null references public.profiles(id) on delete cascade,
  participant_two uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint conversations_unique_pair unique (participant_one, participant_two),
  constraint conversations_not_self check (participant_one <> participant_two)
);

-- Trigger to order participant_one < participant_two on INSERT so the pair is canonical.
-- participant_one > participant_two gets swapped using a temp variable.
create or replace function public.order_conversation_participants()
returns trigger language plpgsql as $$
declare
  tmp uuid;
begin
  if new.participant_one > new.participant_two then
    tmp := new.participant_one;
    new.participant_one := new.participant_two;
    new.participant_two := tmp;
  end if;
  return new;
end;
$$;

create trigger conversations_order_participants
  before insert or update on public.conversations
  for each row execute function public.order_conversation_participants();

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

create index idx_conversations_participant_one on public.conversations(participant_one);
create index idx_conversations_participant_two on public.conversations(participant_two);

-- Helper: check whether the calling user is a participant in the given conversation.
create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.conversations
    where id = conv_id
      and (participant_one = auth.uid() or participant_two = auth.uid())
  );
$$;

-- Helper: check whether at least one of the two users is a mentor or admin
-- (only mentor/admin accounts may initiate chats).
create or replace function public.can_chat(user_a uuid, user_b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id in (user_a, user_b)
      and role in ('mentor', 'admin')
  );
$$;

-- RLS: conversations
create policy "conversations: select own" on public.conversations
  for select using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "conversations: insert own" on public.conversations
  for insert with check (
    auth.uid() in (participant_one, participant_two)
    and public.can_chat(participant_one, participant_two)
  );

-- messages table
create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null references public.profiles(id) on delete cascade,
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint messages_body_not_empty check (char_length(trim(body)) > 0),
  constraint messages_body_max_length check (char_length(body) <= 4000)
);

alter table public.messages enable row level security;

create index idx_messages_conversation_created on public.messages(conversation_id, created_at desc);

create policy "messages: select by participant" on public.messages
  for select using (public.is_conversation_participant(conversation_id));

create policy "messages: insert own" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and public.is_conversation_participant(conversation_id)
  );

-- conversation_read_cursors table — tracks the last-read position per user per conversation.
create table public.conversation_read_cursors (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  last_read_at     timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

alter table public.conversation_read_cursors enable row level security;

create policy "conversation_read_cursors: select own" on public.conversation_read_cursors
  for select using (auth.uid() = profile_id);

create policy "conversation_read_cursors: insert own" on public.conversation_read_cursors
  for insert with check (
    auth.uid() = profile_id
    and public.is_conversation_participant(conversation_id)
  );

create policy "conversation_read_cursors: update own" on public.conversation_read_cursors
  for update using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Touch conversation.updated_at whenever a new message is inserted
-- so conversation lists stay sorted by recency.
create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Enable Supabase Realtime on messages so clients receive push updates.
alter publication supabase_realtime add table public.messages;
