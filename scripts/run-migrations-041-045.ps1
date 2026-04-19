# ---------------------------------------------------------------------------
# Runs migrations 041 → 045 against a Supabase (or any Postgres) instance.
#
# Usage:
#   $env:DATABASE_URL = "postgresql://postgres:<PW>@db.<ref>.supabase.co:5432/postgres"
#   .\scripts\run-migrations-041-045.ps1
#
# Requires: psql on PATH (install via PostgreSQL or Supabase CLI).
#
# The script stops at the first failure. If 044 fails because the trigger
# on auth.users needs elevated privileges, run it from the Supabase SQL
# editor (which executes as `postgres`).
# ---------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
    Write-Error "Set `$env:DATABASE_URL first, e.g. postgresql://postgres:<PW>@db.<ref>.supabase.co:5432/postgres"
    exit 2
}

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @(
    "041_user_levels.sql",
    "042_event_photo_thumbnails.sql",
    "043_match_tuning.sql",
    "044_phone_verification.sql",
    "045_api_keys.sql"
)

foreach ($f in $files) {
    Write-Host "==> $f"
    & psql $env:DATABASE_URL --single-transaction --set ON_ERROR_STOP=1 -f (Join-Path $dir $f)
    if ($LASTEXITCODE -ne 0) {
        Write-Error "$f failed (exit $LASTEXITCODE). Aborting."
        exit $LASTEXITCODE
    }
}

Write-Host "All migrations applied successfully." -ForegroundColor Green
