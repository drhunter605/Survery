-- LatestHire survey database schema
-- Run this entire file in the Supabase SQL Editor for the new project.
-- Only the server-side Supabase secret key should access these tables.

create extension if not exists pgcrypto;

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  submitted_at timestamptz not null default now(),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  comment text
);

create index if not exists survey_responses_submitted_at_idx
  on public.survey_responses (submitted_at desc);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  contact_info text not null,
  message text
);

create index if not exists contact_requests_submitted_at_idx
  on public.contact_requests (submitted_at desc);

create table if not exists public.survey_email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body text not null,
  reference_id text,
  timestamp timestamptz not null default now(),
  status text not null check (status in ('sent', 'queued', 'failed')),
  error text
);

create index if not exists survey_email_logs_timestamp_idx
  on public.survey_email_logs (timestamp desc);

alter table public.survey_responses enable row level security;
alter table public.contact_requests enable row level security;
alter table public.survey_email_logs enable row level security;

revoke all on table public.survey_responses from anon, authenticated;
revoke all on table public.contact_requests from anon, authenticated;
revoke all on table public.survey_email_logs from anon, authenticated;

grant all on table public.survey_responses to service_role;
grant all on table public.contact_requests to service_role;
grant all on table public.survey_email_logs to service_role;
