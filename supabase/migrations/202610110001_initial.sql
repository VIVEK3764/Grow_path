-- All amounts are INR. Records represent money set aside, not payment transfers.
begin;
create table public.profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
 name text not null default '' check(length(name)<=80), age integer check(age between 18 and 120),
 life_stage text not null default 'FIRST_JOB' check(life_stage in ('STUDENT','FIRST_JOB','VARIABLE_INCOME','ALREADY_INVESTING')),
 income_type text not null default 'REGULAR' check(income_type in ('REGULAR','VARIABLE')),
 monthly_income numeric(14,2) not null default 0 check(monthly_income between 0 and 1000000000),
 comfortable_monthly_contribution numeric(14,2) not null default 0 check(comfortable_monthly_contribution between 0 and 1000000000),
 safety_cushion_status text not null default 'NONE' check(safety_cushion_status in ('NONE','PARTIAL','ESTABLISHED')),
 safety_cushion_target numeric(14,2) not null default 15000 check(safety_cushion_target>0 and safety_cushion_target<=1000000000),
 onboarding_completed boolean not null default false, onboarding_step integer not null default 1 check(onboarding_step between 1 and 3), onboarding_goal_id uuid,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.goals (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100), category text not null check(category in ('SAFETY','PURCHASE','EXPERIENCE','UPSKILL','WEALTH','OTHER')),
 target_amount numeric(14,2) not null check(target_amount>0 and target_amount<=1000000000),current_amount numeric(14,2) not null default 0 check(current_amount>=0),
 target_date date not null,priority integer not null default 1 check(priority between 1 and 100),status text not null default 'ACTIVE' check(status in ('ACTIVE','COMPLETED','PAUSED')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,user_id)
);
create unique index one_safety_goal on public.goals(user_id) where category='SAFETY';
create table public.contributions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 goal_id uuid,amount numeric(14,2) not null check(amount>0 and amount<=1000000000),
 contribution_type text not null check(contribution_type in ('MANUAL','MONTHLY_PLAN','ADJUSTMENT')), request_id uuid not null,
 created_at timestamptz not null default now(),foreign key(goal_id,user_id) references public.goals(id,user_id),unique(user_id,request_id,goal_id)
);
create table public.monthly_plans (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 month date not null check(extract(day from month)=1),planned_amount numeric(14,2) not null check(planned_amount between 0 and 1000000000),
 adjusted_amount numeric(14,2) check(adjusted_amount between 0 and 1000000000),contributed_amount numeric(14,2) not null default 0 check(contributed_amount>=0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,month)
);
create table public.path_steps (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 step_type text not null check(step_type in ('BUILD_SAFETY','FUND_GOAL','LEARN_INVESTING','EXPLORE_LONG_TERM')),title text not null,description text not null,
 priority integer not null,status text not null check(status in ('LOCKED','ACTIVE','COMPLETED')),metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,step_type)
);
create table public.decode_history (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,input_text text not null check(length(input_text) between 5 and 4000),
 classification text not null check(classification in ('caution','neutral','high_risk')),result_json jsonb not null,
 created_at timestamptz not null default now()
);
create table public.decode_limits(user_id uuid primary key references auth.users(id) on delete cascade,window_start timestamptz not null default now(),attempts integer not null default 0);
create table public.learning_progress(user_id uuid not null references auth.users(id) on delete cascade,lesson_id text not null,completed_at timestamptz not null default now(),primary key(user_id,lesson_id));
create index goals_owner on public.goals(user_id,priority);
create index contributions_owner_time on public.contributions(user_id,created_at desc);
create index decode_owner_time on public.decode_history(user_id,created_at desc);
do $$ declare t text; begin
 foreach t in array array['profiles','goals','contributions','monthly_plans','path_steps','decode_history','decode_limits','learning_progress'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
-- Mutations use narrow authenticated RPCs. There are deliberately no direct balance-write grants.
create policy owner_insert_decode on public.decode_history for insert to authenticated with check((select auth.uid())=user_id);
grant insert on public.decode_history to authenticated;

create function public.path_snapshot() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();p profiles; m monthly_plans; current_month date:=date_trunc('month',now() at time zone 'Asia/Kolkata')::date;
begin
 if u is null then raise exception 'Please sign in.';end if;
 insert into profiles(user_id) values(u) on conflict(user_id) do nothing;
 select * into p from profiles where user_id=u for update;
 insert into monthly_plans(user_id,month,planned_amount) values(u,current_month,p.comfortable_monthly_contribution) on conflict(user_id,month) do nothing;
 select * into m from monthly_plans where user_id=u and month=current_month;
 return jsonb_build_object('profile',to_jsonb(p),'plan',to_jsonb(m),'goals',coalesce((select jsonb_agg(g order by g.priority,g.created_at) from goals g where user_id=u),'[]'::jsonb),'contributions',coalesce((select jsonb_agg(c order by c.created_at desc) from (select * from contributions where user_id=u order by created_at desc limit 100) c),'[]'::jsonb));
end $$;

create function public.mutate_path(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();p profiles;g goals;primary_goal goals;safety_goal goals; m monthly_plans;gid uuid;rid uuid;amt numeric;sa numeric;ratio numeric;current_month date:=date_trunc('month',now() at time zone 'Asia/Kolkata')::date;
begin
 if u is null then raise exception 'Please sign in.';end if;
 perform path_snapshot();
 select * into p from profiles where user_id=u for update; -- serialize each user's writes, including duplicate requests
 select * into m from monthly_plans where user_id=u and month=current_month for update;
 if action='stage' then
  if length(trim(payload->>'name')) not between 1 and 80 then raise exception 'Enter your name.';end if;
  update profiles set name=trim(payload->>'name'),age=(payload->>'age')::integer,life_stage=payload->>'life_stage',monthly_income=(payload->>'monthly_income')::numeric,onboarding_step=greatest(onboarding_step,2),updated_at=now() where user_id=u;
 elsif action in ('create_goal','onboarding_goal','edit_goal') then
  if (payload->>'target_date')::date < (now() at time zone 'Asia/Kolkata')::date then raise exception 'Choose today or a future date.';end if;
  if action='onboarding_goal' then gid=p.onboarding_goal_id;elsif action='edit_goal' then gid=(payload->>'id')::uuid;end if;
  if gid is null then
   if payload->>'category'='SAFETY' and exists(select 1 from goals where user_id=u and category='SAFETY') then select id into gid from goals where user_id=u and category='SAFETY';end if;
  end if;
  if gid is null then
   insert into goals(user_id,name,category,target_amount,target_date,priority) values(u,trim(payload->>'name'),payload->>'category',(payload->>'target_amount')::numeric,(payload->>'target_date')::date,coalesce((payload->>'priority')::integer,1)) returning id into gid;
  else
   select * into g from goals where id=gid and user_id=u for update;if not found then raise exception 'Goal not found.';end if;
   if (g.category='SAFETY')<>(payload->>'category'='SAFETY') then raise exception 'Keep the safety cushion category unchanged.';end if;
   update goals set name=trim(payload->>'name'),category=payload->>'category',target_amount=(payload->>'target_amount')::numeric,target_date=(payload->>'target_date')::date,priority=coalesce((payload->>'priority')::integer,1),updated_at=now() where id=gid and user_id=u;
  end if;
  if payload->>'category'='SAFETY' then update profiles set safety_cushion_target=(payload->>'target_amount')::numeric,updated_at=now() where user_id=u;end if;
  if action='onboarding_goal' then update profiles set onboarding_goal_id=gid,onboarding_step=3,updated_at=now() where user_id=u;end if;
 elsif action in ('finish','profile') then
  if action='finish' and (p.onboarding_goal_id is null or p.name='') then raise exception 'Complete the earlier onboarding steps first.';end if;
  update profiles set comfortable_monthly_contribution=(payload->>'comfortable_monthly_contribution')::numeric,income_type=payload->>'income_type',safety_cushion_status=payload->>'safety_cushion_status',safety_cushion_target=(payload->>'safety_cushion_target')::numeric,onboarding_completed=case when action='finish' then true else onboarding_completed end,updated_at=now() where user_id=u;
  if action='profile' then
   if length(trim(payload->>'name')) not between 1 and 80 then raise exception 'Enter your name.';end if;
   update profiles set name=trim(payload->>'name'),age=(payload->>'age')::integer,life_stage=payload->>'life_stage',monthly_income=(payload->>'monthly_income')::numeric where user_id=u;
  end if;
  insert into goals(user_id,name,category,target_amount,target_date,priority) values(u,'Safety cushion','SAFETY',(payload->>'safety_cushion_target')::numeric,current_month+interval '1 year',1) on conflict(user_id) where category='SAFETY' do update set target_amount=excluded.target_amount,updated_at=now();
  update monthly_plans set planned_amount=(payload->>'comfortable_monthly_contribution')::numeric,updated_at=now() where id=m.id;
 elsif action='adjust' then
  update monthly_plans set adjusted_amount=(payload->>'amount')::numeric,updated_at=now() where id=m.id;
 elsif action in ('contribute','complete_month') then
  rid=(payload->>'request_id')::uuid;if rid is null then raise exception 'Missing request identifier.';end if;
  if exists(select 1 from contributions where user_id=u and request_id=rid) then return jsonb_build_object('duplicate',true);end if;
  if action='contribute' then
   amt=(payload->>'amount')::numeric;gid=(payload->>'goal_id')::uuid;
   select * into g from goals where id=gid and user_id=u for update;
   if not found then raise exception 'Goal not found.';end if;
   if g.status<>'ACTIVE' then raise exception 'Resume this goal before contributing.';end if;
   if amt is null or amt<=0 or amt>1000000000 then raise exception 'Enter a positive contribution amount.';end if;
   insert into contributions(user_id,goal_id,amount,contribution_type,request_id) values(u,gid,amt,'MANUAL',rid);
  else
   amt=greatest(0,coalesce(m.adjusted_amount,m.planned_amount)-m.contributed_amount);
   if amt=0 then return jsonb_build_object('already_complete',true);end if;
   select * into safety_goal from goals where user_id=u and category='SAFETY';
   select * into primary_goal from goals where user_id=u and category<>'SAFETY' and status='ACTIVE' order by priority,created_at limit 1;
   ratio=case when p.safety_cushion_status='ESTABLISHED' or safety_goal.current_amount>=p.safety_cushion_target then 0 when p.safety_cushion_status='PARTIAL' then 0.5 else 0.7 end;
   if primary_goal.id is null and ratio>0 then ratio=1;end if;
   if safety_goal.id is null or safety_goal.status<>'ACTIVE' then ratio=0;end if;
   if primary_goal.id is null and ratio=0 then raise exception 'Create or resume a goal first.';end if;
   sa=round(amt*ratio,2);
   if sa>0 then insert into contributions(user_id,goal_id,amount,contribution_type,request_id) values(u,safety_goal.id,sa,'MONTHLY_PLAN',rid);end if;
   if amt-sa>0 then insert into contributions(user_id,goal_id,amount,contribution_type,request_id) values(u,primary_goal.id,amt-sa,'MONTHLY_PLAN',rid);end if;
  end if;
  update goals set current_amount=coalesce((select sum(c.amount) from contributions c where c.goal_id=goals.id),0),updated_at=now() where user_id=u;
  update goals set status='COMPLETED',updated_at=now() where user_id=u and status='ACTIVE' and current_amount>=target_amount;
  update monthly_plans set contributed_amount=coalesce((select sum(amount) from contributions where user_id=u and date_trunc('month',created_at at time zone 'Asia/Kolkata')::date=current_month),0),updated_at=now() where id=m.id;
 elsif action='goal_status' then
  update goals set status=payload->>'status',updated_at=now() where id=(payload->>'id')::uuid and user_id=u;
  if not found then raise exception 'Goal not found.';end if;
 elsif action='delete_goal' then
  gid=(payload->>'id')::uuid;select * into g from goals where id=gid and user_id=u;
  if not found then raise exception 'Goal not found.';end if;
  if g.category='SAFETY' then raise exception 'Your safety cushion is managed in your profile.';end if;
  -- Preserve historical monthly totals and the allocation ledger after deleting a goal.
  update contributions set goal_id=null where goal_id=gid and user_id=u;
  update profiles set onboarding_goal_id=null where onboarding_goal_id=gid and user_id=u;
  delete from goals where id=gid and user_id=u;
 elsif action='learn' then
  if payload->>'lesson_id' not in ('safety','ipo','investing') then raise exception 'Lesson not found.';end if;
  insert into learning_progress(user_id,lesson_id) values(u,payload->>'lesson_id') on conflict do nothing;
 else raise exception 'Unsupported operation.';
 end if;
 return jsonb_build_object('ok',true,'id',gid);
end $$;

create function public.save_path_steps(steps_input jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();s jsonb;begin
 if u is null then raise exception 'Please sign in.';end if;
 if jsonb_typeof(steps_input)<>'array' or jsonb_array_length(steps_input)>4 then raise exception 'Invalid Path.';end if;
 perform 1 from profiles where user_id=u for update;
 delete from path_steps where user_id=u;
 for s in select * from jsonb_array_elements(steps_input) loop
 insert into path_steps(user_id,step_type,title,description,priority,status,metadata) values(u,s->>'step_type',left(s->>'title',200),left(s->>'description',500),(s->>'priority')::integer,s->>'status',s->'metadata');end loop;
end $$;
create function public.claim_decode_slot() returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid();n integer;begin
 if u is null then raise exception 'Please sign in.';end if;
 insert into decode_limits(user_id) values(u) on conflict do nothing;
 perform 1 from decode_limits where user_id=u for update;
 update decode_limits set window_start=now(),attempts=0 where user_id=u and window_start<=now()-interval '1 hour';
 update decode_limits set attempts=attempts+1 where user_id=u and attempts<10 returning attempts into n;
 return n is not null;
end $$;
revoke all on function public.path_snapshot(),public.mutate_path(text,jsonb),public.save_path_steps(jsonb),public.claim_decode_slot() from public,anon;
grant execute on function public.path_snapshot(),public.mutate_path(text,jsonb),public.save_path_steps(jsonb),public.claim_decode_slot() to authenticated;
commit;
