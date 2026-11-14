-- ADC staging: aplicar mediante revisión, nunca desde el navegador ni como reset.
begin;
create table public.adc_user_records (
  owner_id uuid not null references auth.users(id) on delete cascade,
  record_key text not null check (char_length(record_key) between 1 and 1024 and record_key ~ '^adc[_.-]'),
  schema_version integer not null default 1 check (schema_version = 1),
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload)='object' and payload ? 'raw' and octet_length(payload::text)<=8388608),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (owner_id,record_key),
  check ((deleted and payload->'raw'='null'::jsonb) or (not deleted and jsonb_typeof(payload->'raw')='string'))
);
alter table public.adc_user_records enable row level security;
alter table public.adc_user_records force row level security;
revoke all on public.adc_user_records from public,anon,authenticated;
grant select,delete on public.adc_user_records to authenticated;
grant insert(owner_id,record_key,schema_version,payload,deleted) on public.adc_user_records to authenticated;
grant update(schema_version,payload,deleted) on public.adc_user_records to authenticated;
create policy adc_records_select_own on public.adc_user_records for select to authenticated using ((select auth.uid())=owner_id);
create policy adc_records_insert_own on public.adc_user_records for insert to authenticated with check ((select auth.uid())=owner_id);
create policy adc_records_update_own on public.adc_user_records for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy adc_records_delete_own on public.adc_user_records for delete to authenticated using ((select auth.uid())=owner_id);
create function public.adc_records_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' then new.revision=old.revision+1;else new.revision=1;end if;
 new.updated_at=now();return new;
end;
$$;
revoke all on function public.adc_records_revision() from public,anon,authenticated;
create trigger adc_records_revision before insert or update on public.adc_user_records for each row execute function public.adc_records_revision();
create function public.adc_sync_put(p_key text,p_raw text,p_expected_revision bigint,p_schema_version integer default 1)
returns public.adc_user_records language plpgsql security invoker set search_path='' as $$
declare result public.adc_user_records; account uuid=auth.uid();
begin
 if account is null then raise exception 'ADC_AUTH_REQUIRED' using errcode='42501';end if;
 if p_expected_revision<0 or p_expected_revision is null then raise exception 'ADC_INVALID_REVISION';end if;
 if p_expected_revision=0 then
  insert into public.adc_user_records(owner_id,record_key,schema_version,payload,deleted)
   values(account,p_key,p_schema_version,jsonb_build_object('raw',p_raw),p_raw is null)
   on conflict(owner_id,record_key) do nothing returning * into result;
 else
  update public.adc_user_records set payload=jsonb_build_object('raw',p_raw),schema_version=p_schema_version,deleted=(p_raw is null)
   where owner_id=account and record_key=p_key and revision=p_expected_revision returning * into result;
 end if;
 if result.owner_id is null then raise exception 'ADC_SYNC_CONFLICT' using errcode='40001';end if;
 return result;
end;
$$;
revoke all on function public.adc_sync_put(text,text,bigint,integer) from public,anon;
grant execute on function public.adc_sync_put(text,text,bigint,integer) to authenticated;
comment on table public.adc_user_records is 'ADC: documentos privados versionados, pueden incluir datos sensibles. Consentimiento explícito en cada dispositivo; sin afirmación de cumplimiento legal.';
commit;
