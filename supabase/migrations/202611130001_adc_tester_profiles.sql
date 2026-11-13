-- ADC STAGING: esquema mínimo para 15–50 testers, sin DNI ni licencias.
-- Aplicar una vez. Nunca ejecutar un reset automático en una nueva iteración.
begin;
create table public.adc_tester_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.adc_tester_profiles enable row level security;
alter table public.adc_tester_profiles force row level security;
revoke all on public.adc_tester_profiles from public, anon, authenticated;
grant select, delete on public.adc_tester_profiles to authenticated;
grant insert (id, display_name) on public.adc_tester_profiles to authenticated;
grant update (display_name) on public.adc_tester_profiles to authenticated;
create policy adc_tester_select_own on public.adc_tester_profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy adc_tester_insert_own on public.adc_tester_profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy adc_tester_update_own on public.adc_tester_profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy adc_tester_delete_own on public.adc_tester_profiles
  for delete to authenticated using ((select auth.uid()) = id);
create function public.adc_tester_touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.adc_tester_touch_updated_at() from public, anon, authenticated;
create trigger adc_tester_updated before update on public.adc_tester_profiles
  for each row execute function public.adc_tester_touch_updated_at();
comment on table public.adc_tester_profiles is 'ADC staging: perfil mínimo de tester; reset sólo con autorización explícita.';
commit;
