# 041 → 045 마이그레이션 실행 가이드

이 다섯 개의 마이그레이션은 P22 → P26 기능(레벨/XP, 썸네일, 매칭 튜닝, SMS 인증, 공개 API)을 활성화합니다. Cowork 샌드박스에서는 원격 Supabase에 직접 접속할 수 없으므로, 로컬에서 아래 세 방법 중 하나로 실행하세요.

## 포함 파일

| 파일 | 역할 |
|---|---|
| `041_user_levels.sql` | `profiles.xp / level` + 업적 트리거 |
| `042_event_photo_thumbnails.sql` | `event_photos.thumb_*` + 썸네일 버킷 |
| `043_match_tuning.sql` | `match_tuning` 싱글톤 + 기본값 시드 |
| `044_phone_verification.sql` | `profiles.phone_verified_at` + `auth.users` 미러 트리거 |
| `045_api_keys.sql` | `api_keys`, `api_key_usage` + `increment_api_usage()` RPC |
| `_combined_041_045.sql` | 5개 파일을 `begin … commit` 하나로 묶은 통합 파일 |
| `run-migrations-041-045.sh` | macOS/Linux 러너 (psql 필요) |
| `run-migrations-041-045.ps1` | Windows PowerShell 러너 (psql 필요) |

## 방법 1 — Supabase 대시보드 SQL 편집기 (가장 간단)

1. Supabase 프로젝트 → SQL Editor → New query
2. `scripts/_combined_041_045.sql` 내용을 통째로 붙여넣기
3. Run 클릭 → 성공 시 "Success. No rows returned."
4. 실패 시 트랜잭션이 통째로 롤백되므로 안전하게 수정 후 재시도

> 대시보드 SQL 편집기는 `postgres` 역할로 실행되므로 044의 `auth.users` 트리거도 문제없이 생성됩니다.

## 방법 2 — psql + 스크립트 러너

`psql`은 PostgreSQL 클라이언트(`brew install libpq` 또는 Postgres 설치)로 함께 제공됩니다.

```bash
# macOS / Linux
export DATABASE_URL="postgresql://postgres:<PW>@db.<project-ref>.supabase.co:5432/postgres"
./scripts/run-migrations-041-045.sh
```

```powershell
# Windows PowerShell
$env:DATABASE_URL = "postgresql://postgres:<PW>@db.<project-ref>.supabase.co:5432/postgres"
.\scripts\run-migrations-041-045.ps1
```

`DATABASE_URL`은 Supabase 프로젝트 → Settings → Database → Connection string → URI.

러너는 파일을 하나씩 `--single-transaction --set ON_ERROR_STOP=1`로 실행하므로 실패한 위치가 즉시 드러납니다.

## 방법 3 — Supabase CLI

로컬에서 `supabase/migrations` 디렉토리로 마이그레이션을 옮긴 뒤 CLI가 관리하도록 하려면:

```bash
mkdir -p supabase/migrations
for f in scripts/04{1,2,3,4,5}*.sql; do
  base=$(basename "$f" .sql)
  # Supabase CLI는 타임스탬프 접두사를 요구합니다.
  cp "$f" "supabase/migrations/$(date -u +%Y%m%d%H%M%S)_${base}.sql"
  sleep 1 # 타임스탬프 유일성 확보
done
supabase db push
```

## 실행 후 점검 체크리스트

SQL 편집기에서 다음을 순서대로 돌려 결과가 모두 비어있지 않은지 확인하세요.

```sql
-- 041
select count(*) filter (where xp is not null) as xp_rows,
       count(*) filter (where level is not null) as level_rows
from public.profiles;

-- 042
select count(*) from storage.buckets where id = 'event-photo-thumbnails';

-- 043
select * from public.match_tuning where id = 'current';

-- 044
select routine_schema, routine_name
from information_schema.routines
where routine_name in ('is_phone_verified','sync_phone_verified');

-- 045
select tablename from pg_tables
where schemaname = 'public' and tablename in ('api_keys','api_key_usage');
```

모두 정상이면 배포 후 `/settings/api-keys`, `/settings/phone`, `/admin/matching` 페이지가 바로 동작합니다.

## 롤백

각 마이그레이션은 `create if not exists` 패턴이라 반복 실행은 안전합니다. 완전 롤백이 필요하면 역순으로:

```sql
drop table if exists public.api_key_usage cascade;
drop table if exists public.api_keys cascade;
drop function if exists public.increment_api_usage cascade;

drop function if exists public.is_phone_verified cascade;
drop trigger if exists auth_users_phone_sync on auth.users;
drop function if exists public.sync_phone_verified cascade;
alter table public.profiles drop column if exists phone_verified_at;

drop table if exists public.match_tuning cascade;

drop index if exists event_photos_thumb_status_idx;
alter table public.event_photos
  drop column if exists thumb_path,
  drop column if exists thumb_url,
  drop column if exists thumb_status,
  drop column if exists thumb_error;
delete from storage.buckets where id = 'event-photo-thumbnails';

drop trigger if exists user_achievements_xp_sync on public.user_achievements;
drop function if exists public.recompute_user_xp cascade;
drop function if exists public.compute_level cascade;
alter table public.profiles
  drop column if exists xp,
  drop column if exists level;
```
