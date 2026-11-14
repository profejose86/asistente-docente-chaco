-- Un conflicto de negocio no es un serialization_failure reintentable.
begin;
create or replace function public.adc_sync_put(p_key text,p_raw text,p_expected_revision bigint,p_schema_version integer default 1)
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
 if result.owner_id is null then raise exception 'ADC_SYNC_CONFLICT' using errcode='PT409';end if;
 return result;
end;
$$;
commit;
