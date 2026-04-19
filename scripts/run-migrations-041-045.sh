#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Runs migrations 041 → 045 against a Supabase (or any Postgres) instance.
#
# Usage:
#   # Option A — using psql directly (recommended for one-shot runs)
#   export DATABASE_URL="postgresql://postgres:<PW>@db.<ref>.supabase.co:5432/postgres"
#   ./run-migrations-041-045.sh
#
#   # Option B — using Supabase CLI (keeps its migration ledger in sync)
#   # Copy the 5 files into supabase/migrations first, then:
#   #   supabase db push
#
# This script stops at the first failure. Migrations run one-by-one so you
# can see exactly which step failed in case of permission issues (e.g. the
# 044 trigger on auth.users requires the `postgres` role).
# ---------------------------------------------------------------------------
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: set DATABASE_URL to your Postgres connection string." >&2
  echo "       postgresql://postgres:<PW>@db.<project-ref>.supabase.co:5432/postgres" >&2
  exit 2
fi

DIR=$(cd "$(dirname "$0")" && pwd)

for f in 041_user_levels.sql 042_event_photo_thumbnails.sql 043_match_tuning.sql 044_phone_verification.sql 045_api_keys.sql; do
  printf "==> %s\n" "$f"
  psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=1 -f "$DIR/$f"
done

echo "All migrations applied successfully."
