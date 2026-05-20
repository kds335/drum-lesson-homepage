-- ===================================================
-- 비트스튜디오 드럼교습소 DB 스키마
-- Supabase SQL Editor에서 실행하세요
-- ===================================================

-- 1. 사용자 프로필 테이블 (auth.users와 1:1 연결)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  phone text,
  created_at timestamptz default now() not null
);

-- 2. 레슨 종류 테이블
create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  duration integer not null,
  price integer not null,
  category text not null check (category in ('individual', 'group', 'online')),
  created_at timestamptz default now() not null
);

-- 3. 수업 가능 시간 슬롯 테이블 (강사 설정)
create table if not exists schedules (
  id uuid default gen_random_uuid() primary key,
  day_of_week smallint not null check (day_of_week between 1 and 6), -- 1=월, 6=토
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz default now() not null,
  unique (day_of_week, start_time)
);

-- 4. 예약 테이블
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz default now() not null
);

-- ===================================================
-- RLS 활성화
-- ===================================================
alter table profiles enable row level security;
alter table lessons enable row level security;
alter table schedules enable row level security;
alter table bookings enable row level security;

-- ===================================================
-- 헬퍼 함수 (재귀 방지를 위해 security definer 사용)
-- ===================================================
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ===================================================
-- profiles 정책
-- ===================================================
drop policy if exists "users can view own profile" on profiles;
create policy "users can view own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "admins can view all profiles" on profiles;
create policy "admins can view all profiles" on profiles
  for select using (get_user_role() = 'admin');

drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

drop policy if exists "users can insert own profile" on profiles;
create policy "users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- ===================================================
-- lessons 정책
-- ===================================================
drop policy if exists "anyone can view lessons" on lessons;
create policy "anyone can view lessons" on lessons
  for select using (true);

drop policy if exists "admins can manage lessons" on lessons;
create policy "admins can manage lessons" on lessons
  for all using (get_user_role() = 'admin');

-- ===================================================
-- schedules 정책
-- ===================================================
drop policy if exists "anyone can view schedules" on schedules;
create policy "anyone can view schedules" on schedules
  for select using (true);

drop policy if exists "admins can manage schedules" on schedules;
create policy "admins can manage schedules" on schedules
  for all using (get_user_role() = 'admin');

-- ===================================================
-- bookings 정책
-- ===================================================
drop policy if exists "students can view own bookings" on bookings;
create policy "students can view own bookings" on bookings
  for select using (auth.uid() = student_id);

drop policy if exists "admins can view all bookings" on bookings;
create policy "admins can view all bookings" on bookings
  for select using (get_user_role() = 'admin');

drop policy if exists "students can create bookings" on bookings;
create policy "students can create bookings" on bookings
  for insert with check (auth.uid() = student_id);

drop policy if exists "students can cancel own bookings" on bookings;
create policy "students can cancel own bookings" on bookings
  for update using (auth.uid() = student_id)
  with check (status = 'cancelled');

drop policy if exists "admins can update bookings" on bookings;
create policy "admins can update bookings" on bookings
  for update using (get_user_role() = 'admin');

-- ===================================================
-- 트리거: 새 사용자 등록 시 프로필 자동 생성
-- ===================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '수강생'),
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===================================================
-- 초기 데이터
-- ===================================================

-- 레슨 데이터
insert into lessons (name, description, duration, price, category) values
  ('개인 레슨 (기초)', '드럼의 기초부터 체계적으로 배우는 1:1 맞춤 레슨입니다.', 50, 80000, 'individual'),
  ('개인 레슨 (중급)', '다양한 장르의 리듬과 응용 패턴을 배웁니다.', 50, 90000, 'individual'),
  ('그룹 레슨 (2인)', '2인이 함께하는 그룹 레슨으로 앙상블 연주의 재미를 느낍니다.', 60, 55000, 'group'),
  ('온라인 레슨', '화상 통화를 통한 비대면 레슨입니다.', 50, 70000, 'online'),
  ('원데이 클래스', '드럼을 처음 접하는 분들을 위한 체험 수업.', 90, 40000, 'group')
on conflict do nothing;

-- 수업 가능 시간 슬롯 (월~토, 10:00~20:00)
insert into schedules (day_of_week, start_time, end_time) values
  (1, '10:00', '11:00'), (1, '11:00', '12:00'), (1, '13:00', '14:00'),
  (1, '14:00', '15:00'), (1, '15:00', '16:00'), (1, '16:00', '17:00'),
  (1, '18:00', '19:00'), (1, '19:00', '20:00'),
  (2, '10:00', '11:00'), (2, '11:00', '12:00'), (2, '13:00', '14:00'),
  (2, '14:00', '15:00'), (2, '15:00', '16:00'), (2, '16:00', '17:00'),
  (2, '18:00', '19:00'), (2, '19:00', '20:00'),
  (3, '10:00', '11:00'), (3, '11:00', '12:00'), (3, '13:00', '14:00'),
  (3, '14:00', '15:00'), (3, '15:00', '16:00'), (3, '16:00', '17:00'),
  (3, '18:00', '19:00'), (3, '19:00', '20:00'),
  (4, '10:00', '11:00'), (4, '11:00', '12:00'), (4, '13:00', '14:00'),
  (4, '14:00', '15:00'), (4, '15:00', '16:00'), (4, '16:00', '17:00'),
  (4, '18:00', '19:00'), (4, '19:00', '20:00'),
  (5, '10:00', '11:00'), (5, '11:00', '12:00'), (5, '13:00', '14:00'),
  (5, '14:00', '15:00'), (5, '15:00', '16:00'), (5, '16:00', '17:00'),
  (5, '18:00', '19:00'), (5, '19:00', '20:00'),
  (6, '10:00', '11:00'), (6, '11:00', '12:00'), (6, '13:00', '14:00'),
  (6, '14:00', '15:00'), (6, '15:00', '16:00')
on conflict do nothing;
