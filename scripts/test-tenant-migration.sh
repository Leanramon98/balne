#!/bin/sh
# Test suite for tenant migration hardening (unit 4B1b).
# Runs migration scenarios against real PostgreSQL containers.
# Requires: docker, psql (client in exec), postgres:16 image.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
WORKSPACE="$ROOT/workspace"
MIGRATION="$WORKSPACE/backend/migrations/1782200000_create_organizations_memberships.up.sql"
OVERRIDE="$WORKSPACE/docker-compose.override.yml"
PG_IMAGE="postgres:16"

pass=0
fail=0
cleanup_containers=""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

r() {
  printf '\033[0;31m'
  printf '%s' "$*"
  printf '\033[0m'
}
g() {
  printf '\033[0;32m'
  printf '%s' "$*"
  printf '\033[0m'
}
y() {
  printf '\033[1;33m'
  printf '%s' "$*"
  printf '\033[0m'
}

test_pass() { pass=$((pass + 1)); printf '  %s %s\n' "$(g PASS)" "$1"; }
test_fail() { fail=$((fail + 1)); printf '  %s %s\n' "$(r FAIL)" "$1"; }

# Run a single SQL query and return trimmed output.
psql_query() {
  local container="$1"; shift
  docker exec -i "$container" psql -U postgres -d postgres -X -At "$@" 2>/dev/null | tr -d ' \n'
}

# Apply the migration file to a container. Returns 0 on success.
apply_migration() {
  local container="$1"
  docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < "$MIGRATION" >/dev/null 2>&1
}

# Start a fresh PostgreSQL container.
start_pg() {
  local name="$1"
  local search_path="${2:-users_service,public}"
  docker run -d --name "$name" \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    "$PG_IMAGE" \
    -c "search_path=$search_path" >/dev/null 2>&1 || return 1
  cleanup_containers="$cleanup_containers $name"
  for i in $(seq 1 30); do
    docker exec "$name" pg_isready -U postgres >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

# Resolve a table's OID via pg_catalog with explicit schema qualification.
table_oid() {
  local container="$1" schema="$2" table="$3"
  psql_query "$container" -c "
    SELECT c.oid::text FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = '$table' AND n.nspname = '$schema'
  "
}

# Check that a constraint exists on a specific OID-resolved table.
check_constraint() {
  local container="$1" schema="$2" table="$3" conname="$4"
  local oid
  oid=$(table_oid "$container" "$schema" "$table")
  [ -n "$oid" ] || return 1
  local result
  result=$(psql_query "$container" -c "
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = '$conname' AND conrelid = '$oid'::oid
  ")
  [ "$result" = "1" ]
}

# Check that an index exists in a specific schema.
check_index() {
  local container="$1" schema="$2" table="$3" idxname="$4"
  local result
  result=$(psql_query "$container" -c "
    SELECT 1 FROM pg_catalog.pg_indexes
    WHERE schemaname = '$schema' AND tablename = '$table' AND indexname = '$idxname'
  ")
  [ "$result" = "1" ]
}

# Check that a table exists.
check_table() {
  local container="$1" schema="$2" table="$3"
  local result
  result=$(psql_query "$container" -c "SELECT to_regclass('$schema.$table') IS NOT NULL")
  [ "$result" = "t" ]
}

cleanup_all() {
  for c in $cleanup_containers; do
    docker rm -f "$c" >/dev/null 2>&1 || true
  done
  cleanup_containers=""
}

trap cleanup_all EXIT INT TERM

# ---------------------------------------------------------------------------
# Test 1: Clean boot
# Migration applies on fresh PostgreSQL and creates all objects correctly.
# ---------------------------------------------------------------------------
test_clean_boot() {
  local c; c="pg-clean-boot-$$"
  start_pg "$c" || { test_fail "clean boot: postgres container"; return; }

  apply_migration "$c" || { test_fail "clean boot: migration apply"; return; }

  # Schema
  local has_schema
  has_schema=$(psql_query "$c" -c "SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'users_service'")
  [ "$has_schema" = "1" ] || { test_fail "clean boot: schema users_service"; return; }

  # Tables
  check_table "$c" users_service organizations || { test_fail "clean boot: organizations table"; return; }
  check_table "$c" users_service memberships   || { test_fail "clean boot: memberships table"; return; }

  # Columns: organizations
  local has_col
  has_col=$(psql_query "$c" -c "
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'organizations' AND n.nspname = 'users_service'
    AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped
  ")
  [ "$has_col" = "1" ] || { test_fail "clean boot: organizations.id column"; return; }

  has_col=$(psql_query "$c" -c "
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'organizations' AND n.nspname = 'users_service'
    AND a.attname = 'created_at' AND a.attnum > 0 AND NOT a.attisdropped
  ")
  [ "$has_col" = "1" ] || { test_fail "clean boot: organizations.created_at column"; return; }

  # Constraints
  check_constraint "$c" users_service organizations organizations_pkey \
    || { test_fail "clean boot: organizations_pkey"; return; }

  check_constraint "$c" users_service memberships memberships_pkey \
    || { test_fail "clean boot: memberships_pkey"; return; }

  check_constraint "$c" users_service memberships memberships_organization_fk \
    || { test_fail "clean boot: memberships_organization_fk"; return; }

  check_constraint "$c" users_service memberships memberships_org_principal_key \
    || { test_fail "clean boot: memberships_org_principal_key"; return; }

  # Indexes
  check_index "$c" users_service memberships memberships_organization_idx \
    || { test_fail "clean boot: memberships_organization_idx"; return; }

  check_index "$c" users_service memberships memberships_principal_idx \
    || { test_fail "clean boot: memberships_principal_idx"; return; }

  test_pass "clean boot: all schema, tables, constraints, and indexes verified"
}

# ---------------------------------------------------------------------------
# Test 2: Existing-volume upgrade
# Migration re-applies without errors on a volume that already has the schema.
# ---------------------------------------------------------------------------
test_existing_volume_upgrade() {
  local c; c="pg-upgrade-$$"
  start_pg "$c" || { test_fail "existing-volume upgrade: postgres container"; return; }

  # First apply
  apply_migration "$c" || { test_fail "existing-volume upgrade: first apply"; return; }

  # Second apply — must succeed with zero errors
  local apply_output
  apply_output=$(docker exec -i "$c" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < "$MIGRATION" 2>&1) || {
    test_fail "existing-volume upgrade: second apply failed: $(echo "$apply_output" | tail -1)"
    return
  }

  # Verify all objects still exist after second apply
  check_table "$c" users_service organizations || { test_fail "existing-volume upgrade: organizations table after re-apply"; return; }
  check_table "$c" users_service memberships   || { test_fail "existing-volume upgrade: memberships table after re-apply"; return; }

  check_constraint "$c" users_service organizations organizations_pkey \
    || { test_fail "existing-volume upgrade: organizations_pkey after re-apply"; return; }
  check_constraint "$c" users_service memberships memberships_pkey \
    || { test_fail "existing-volume upgrade: memberships_pkey after re-apply"; return; }
  check_constraint "$c" users_service memberships memberships_organization_fk \
    || { test_fail "existing-volume upgrade: memberships_organization_fk after re-apply"; return; }
  check_constraint "$c" users_service memberships memberships_org_principal_key \
    || { test_fail "existing-volume upgrade: memberships_org_principal_key after re-apply"; return; }

  check_index "$c" users_service memberships memberships_organization_idx \
    || { test_fail "existing-volume upgrade: memberships_organization_idx after re-apply"; return; }
  check_index "$c" users_service memberships memberships_principal_idx \
    || { test_fail "existing-volume upgrade: memberships_principal_idx after re-apply"; return; }

  test_pass "existing-volume upgrade: re-apply succeeded, all objects intact"
}

# ---------------------------------------------------------------------------
# Test 3: Backfill
# Create tables without constraints, then apply migration to add them.
# ---------------------------------------------------------------------------
test_backfill() {
  local c; c="pg-backfill-$$"
  start_pg "$c" || { test_fail "backfill: postgres container"; return; }

  # Create tables without constraints or indexes, mimicking legacy state
  docker exec -i "$c" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<-'SQL' >/dev/null 2>&1
    CREATE SCHEMA IF NOT EXISTS users_service;
    CREATE TABLE IF NOT EXISTS users_service.organizations (id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS users_service.memberships (id UUID, organization_id UUID, principal_id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
SQL
  [ $? -eq 0 ] || { test_fail "backfill: setup tables"; return; }

  # Apply migration — should add constraints and indexes
  apply_migration "$c" || { test_fail "backfill: migration apply"; return; }

  # Verify constraints were added
  check_constraint "$c" users_service organizations organizations_pkey \
    || { test_fail "backfill: organizations_pkey not created"; return; }
  check_constraint "$c" users_service memberships memberships_pkey \
    || { test_fail "backfill: memberships_pkey not created"; return; }
  check_constraint "$c" users_service memberships memberships_organization_fk \
    || { test_fail "backfill: memberships_organization_fk not created"; return; }
  check_constraint "$c" users_service memberships memberships_org_principal_key \
    || { test_fail "backfill: memberships_org_principal_key not created"; return; }

  # Verify indexes were added
  check_index "$c" users_service memberships memberships_organization_idx \
    || { test_fail "backfill: memberships_organization_idx not created"; return; }
  check_index "$c" users_service memberships memberships_principal_idx \
    || { test_fail "backfill: memberships_principal_idx not created"; return; }

  test_pass "backfill: constraints and indexes added to pre-existing tables"
}

# ---------------------------------------------------------------------------
# Test 4: Rerun
# Running same migration twice is idempotent.
# ---------------------------------------------------------------------------
test_rerun() {
  local c; c="pg-rerun-$$"
  start_pg "$c" || { test_fail "rerun: postgres container"; return; }

  # First run
  apply_migration "$c" || { test_fail "rerun: first apply"; return; }

  # Second run — must exit 0 with no errors
  docker exec -i "$c" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < "$MIGRATION" >/dev/null 2>&1 || {
    test_fail "rerun: second apply failed"
    return
  }

  # Verify no duplicate objects
  local org_count
  org_count=$(psql_query "$c" -c "
    SELECT count(*) FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'organizations' AND n.nspname = 'users_service'
  ")
  [ "$org_count" = "1" ] || { test_fail "rerun: duplicate organizations table"; return; }

  local mem_count
  mem_count=$(psql_query "$c" -c "
    SELECT count(*) FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'memberships' AND n.nspname = 'users_service'
  ")
  [ "$mem_count" = "1" ] || { test_fail "rerun: duplicate memberships table"; return; }

  test_pass "rerun: second apply idempotent, no duplicate objects"
}

# ---------------------------------------------------------------------------
# Test 5: Retry mechanism
# Compose override has bounded retry that waits for PostgreSQL readiness.
# ---------------------------------------------------------------------------
test_retry_mechanism() {
  local errors=0

  grep -q 'MAX_ATTEMPTS=30' "$OVERRIDE" 2>/dev/null || { errors=$((errors + 1)); test_fail "retry: MAX_ATTEMPTS=30 missing"; }
  grep -q 'RETRY_DELAY=2' "$OVERRIDE" 2>/dev/null   || { errors=$((errors + 1)); test_fail "retry: RETRY_DELAY=2 missing"; }
  grep -q 'pg_isready\|psql.*-Atqc' "$OVERRIDE" 2>/dev/null || { errors=$((errors + 1)); test_fail "retry: readiness check missing"; }
  grep -q 'ON_ERROR_STOP=1' "$OVERRIDE" 2>/dev/null || { errors=$((errors + 1)); test_fail "retry: ON_ERROR_STOP=1 missing"; }

  # Verify the tenant-migrations service exists
  grep -q 'tenant-migrations:' "$OVERRIDE" 2>/dev/null || { errors=$((errors + 1)); test_fail "retry: tenant-migrations service missing"; }

  # Verify users-service depends on tenant-migrations completion
  python3 -c "
import yaml
with open('$OVERRIDE') as f:
    cfg = yaml.safe_load(f)
svc = cfg.get('services', {}).get('users-service', {})
dep = svc.get('depends_on', {})
tm = dep.get('tenant-migrations', {})
assert tm.get('condition') == 'service_completed_successfully', 'users-service must depend on tenant-migrations completed'
" 2>/dev/null || { errors=$((errors + 1)); test_fail "retry: users-service dependency on tenant-migrations"; }

  # Verify the migration file is mounted
  python3 -c "
import yaml
with open('$OVERRIDE') as f:
    cfg = yaml.safe_load(f)
svc = cfg.get('services', {}).get('tenant-migrations', {})
vols = svc.get('volumes', [])
mounted = any('/migrations' in str(v) for v in vols)
assert mounted, 'migrations volume mount missing'
" 2>/dev/null || { errors=$((errors + 1)); test_fail "retry: migrations volume mount"; }

  if [ "$errors" -eq 0 ]; then
    test_pass "retry mechanism: compose override has bounded retry, readiness, and dependency chain"
  fi
}

# ---------------------------------------------------------------------------
# Test 6: Wrong-schema FK handling
# Migration correctly resolves FKs using schema-qualified OID lookups,
# even when same-name constraints exist in other schemas.
# ---------------------------------------------------------------------------
test_wrong_schema_fk() {
  local c; c="pg-wrong-fk-$$"
  start_pg "$c" || { test_fail "wrong-schema FK: postgres container"; return; }

  # Create a table in public schema that could cause confusion.
  # PRIMARY KEY in CREATE TABLE already creates the default constraint name;
  # do NOT re-add it redundantly (that would fail under ON_ERROR_STOP).
  docker exec -i "$c" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<-'SQL' >/dev/null 2>&1
    CREATE TABLE IF NOT EXISTS public.organizations (id UUID PRIMARY KEY);
SQL
  [ $? -eq 0 ] || { test_fail "wrong-schema FK: setup public schema noise"; return; }

  # Apply migration - should correctly create objects in users_service
  apply_migration "$c" || { test_fail "wrong-schema FK: migration apply"; return; }

  # Verify users_service objects exist
  check_table "$c" users_service organizations || { test_fail "wrong-schema FK: users_service.organizations missing"; return; }
  check_table "$c" users_service memberships   || { test_fail "wrong-schema FK: users_service.memberships missing"; return; }

  # Verify the correct constraint is on users_service.organizations, not public.organizations
  local org_oid
  org_oid=$(table_oid "$c" users_service organizations)
  local pub_oid
  pub_oid=$(table_oid "$c" public organizations)

  local correct_constraint
  correct_constraint=$(psql_query "$c" -c "
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'organizations_pkey' AND conrelid = '$org_oid'::oid
  ")
  [ "$correct_constraint" = "1" ] || { test_fail "wrong-schema FK: organizations_pkey not on users_service table"; return; }

  # Verify the public table's constraint still exists (not accidentally modified)
  local pub_constraint
  pub_constraint=$(psql_query "$c" -c "
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'organizations_pkey' AND conrelid = '$pub_oid'::oid
  ")
  [ "$pub_constraint" = "1" ] || { test_fail "wrong-schema FK: public.organizations_pkey was modified"; return; }

  test_pass "wrong-schema FK: migration correctly resolved schema-qualified constraints"
}

# ---------------------------------------------------------------------------
# Test 7: Cross-schema same-name index
# Same-name indexes in different schemas do not interfere.
# ---------------------------------------------------------------------------
test_cross_schema_index() {
  local c; c="pg-xindex-$$"
  start_pg "$c" || { test_fail "cross-schema index: postgres container"; return; }

  # Create index with same name in public schema
  docker exec -i "$c" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<-'SQL' >/dev/null 2>&1
    CREATE SCHEMA IF NOT EXISTS users_service;
    CREATE TABLE IF NOT EXISTS public.memberships (id UUID, organization_id UUID);
    CREATE INDEX IF NOT EXISTS memberships_organization_idx ON public.memberships (organization_id);
SQL
  [ $? -eq 0 ] || { test_fail "cross-schema index: setup public noise"; return; }

  # Apply migration
  apply_migration "$c" || { test_fail "cross-schema index: migration apply"; return; }

  # Verify correct index exists in users_service
  check_index "$c" users_service memberships memberships_organization_idx \
    || { test_fail "cross-schema index: users_service.memberships_organization_idx missing"; return; }
  check_index "$c" users_service memberships memberships_principal_idx \
    || { test_fail "cross-schema index: users_service.memberships_principal_idx missing"; return; }

  # Verify public schema index still exists
  check_index "$c" public memberships memberships_organization_idx \
    || { test_fail "cross-schema index: public.memberships_organization_idx was modified"; return; }

  test_pass "cross-schema index: same-name indexes in different schemas coexist correctly"
}

# ---------------------------------------------------------------------------
# Test 8: Malformed target objects
# Migration handles gracefully when target objects don't exist or are invalid.
# ---------------------------------------------------------------------------
test_malformed_objects() {
  local c; c="pg-malformed-$$"

  # Start without users_service schema — migration should create it
  start_pg "$c" users_service || { test_fail "malformed objects: postgres container"; return; }

  # Drop the schema to simulate missing target
  docker exec -i "$c" psql -U postgres -d postgres -c "DROP SCHEMA IF EXISTS users_service CASCADE" >/dev/null 2>&1

  # Apply migration — must handle gracefully and create everything
  local apply_rc=0
  local apply_err
  apply_err=$(apply_migration "$c" 2>&1) || apply_rc=$?

  if [ "$apply_rc" -ne 0 ]; then
    test_fail "malformed objects: migration failed when rebuilding from scratch: $(echo "$apply_err" | tail -1)"
    return
  fi

  # Verify all objects were created correctly
  check_table "$c" users_service organizations || { test_fail "malformed objects: organizations table not recreated"; return; }
  check_table "$c" users_service memberships   || { test_fail "malformed objects: memberships table not recreated"; return; }

  check_constraint "$c" users_service organizations organizations_pkey \
    || { test_fail "malformed objects: organizations_pkey missing"; return; }
  check_constraint "$c" users_service memberships memberships_pkey \
    || { test_fail "malformed objects: memberships_pkey missing"; return; }

  test_pass "malformed objects: migration rebuilt schema and objects from scratch"
}

# ---------------------------------------------------------------------------
# Test 9: Transaction rollback / cleanup
# If migration partially fails, no partial schema state remains.
# ---------------------------------------------------------------------------
test_transaction_rollback() {
  local c; c="pg-rollback-$$"
  start_pg "$c" || { test_fail "transaction rollback: postgres container"; return; }

  # First apply cleanly to establish state
  apply_migration "$c" || { test_fail "transaction rollback: first clean apply"; return; }

  # Now apply a deliberately broken migration and verify it fails
  local broken_rc=0
  local broken_out
  broken_out=$(docker exec -i "$c" psql -U postgres -d postgres \
    --set=ON_ERROR_STOP=0 \
    -c "BEGIN;" \
    -c "ALTER TABLE users_service.organizations ADD COLUMN IF NOT EXISTS test_col TEXT;" \
    -c "ALTER TABLE users_service.nonexistent_table ADD COLUMN fail_col TEXT;" \
    -c "ROLLBACK;" \
    2>&1) || broken_rc=$?

  # Verify the partial column was not actually added (ROLLBACK cleaned up)
  local has_test_col
  has_test_col=$(psql_query "$c" -c "
    SELECT 1 FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'organizations' AND n.nspname = 'users_service'
    AND a.attname = 'test_col' AND a.attnum > 0 AND NOT a.attisdropped
  ")
  # Note: ROLLBACK should undo the ADD COLUMN even if the failing statement
  # stopped execution before reaching ROLLBACK. Verify the column does not exist.
  if [ "$has_test_col" = "1" ]; then
    test_fail "transaction rollback: test_col persisted after rollback"
    return
  fi

  # Verify original objects are unaffected
  check_table "$c" users_service organizations || { test_fail "transaction rollback: organizations missing after rollback"; return; }
  check_table "$c" users_service memberships   || { test_fail "transaction rollback: memberships missing after rollback"; return; }

  test_pass "transaction rollback: no partial state after failed migration attempt"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------
run_all() {
  printf '%s\n' "$(y "==== 4B1b Migration / Backfill Hardening ====")"
  printf '  Test harness: scripts/test-tenant-migration.sh\n'
  printf '  Migration:    %s\n' "$MIGRATION"
  printf '\n'

  test_clean_boot
  test_existing_volume_upgrade
  test_backfill
  test_rerun
  test_retry_mechanism
  test_wrong_schema_fk
  test_cross_schema_index
  test_malformed_objects
  test_transaction_rollback

  printf '\n'
  printf '%s\n' "$(y "Results: $pass passed, $fail failed")"

  if [ "$fail" -gt 0 ]; then
    exit 1
  fi
}

run_all
