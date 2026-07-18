#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
WORKSPACE="$ROOT/workspace"
OVERRIDE="$WORKSPACE/docker-compose.override.yml"
PROJECT="compose-contract-$$"

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

make_workspace() {
  make -s -C "$WORKSPACE" COMPOSE_PROJECT_NAME="$PROJECT" "$@"
}

cleanup() {
  make_workspace DOWN_ARGS="-v --remove-orphans --rmi local" down >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

service_id() {
  docker ps -aq \
    --filter "label=com.docker.compose.project=$PROJECT" \
    --filter "label=com.docker.compose.service=$1"
}

wait_for_state() {
  service=$1 expected=$2 attempts=0
  container=$(service_id "$service")
  [ -n "$container" ] || fail "$service container was not created"
  until [ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container")" = "$expected" ]; do
    attempts=$((attempts + 1))
    [ "$attempts" -lt 120 ] || fail "$service did not reach $expected"
    sleep 1
  done
  printf '%s' "$container"
}

test_makefile_contract() {
  [ -f "$OVERRIDE" ] || fail "workspace Compose override is missing"
  git -C "$ROOT" check-ignore -q "$OVERRIDE" && fail "workspace Compose override is ignored"
  grep -Fx 'infra/docker-compose.yml' "$WORKSPACE/README.md" >/dev/null || fail "README omits base Compose file"
  grep -Fx 'docker-compose.override.yml' "$WORKSPACE/README.md" >/dev/null || fail "README omits Compose override"
  expected='docker compose -f infra/docker-compose.yml -f docker-compose.override.yml'
  for target in build up down logs ps config; do
    output=$(make -s -C "$WORKSPACE" -n "$target")
    case "$output" in
      *"$expected"*) ;;
      *) fail "make $target does not use the ordered Compose file set" ;;
    esac
  done
}

test_effective_config() {
  make_workspace CONFIG_ARGS="--format json" config | python3 -c '
import json, sys

services = json.load(sys.stdin)["services"]
migration = services["tenant-migrations"]
command = "\n".join(migration["command"])

assert migration["image"] == "postgres:16"
assert migration["depends_on"]["postgres"]["condition"] == "service_healthy"
assert any(v["target"] == "/migrations" and v["type"] == "bind" for v in migration["volumes"])
assert "MAX_ATTEMPTS=30" in command
assert "sleep \"$${RETRY_DELAY}\"" in command
assert "ON_ERROR_STOP=1" in command
assert "/migrations/*.up.sql" in command
dependencies = services["users-service"]["depends_on"]
assert set(dependencies) == {"postgres", "rabbitmq", "tenant-migrations"}
assert dependencies["postgres"]["condition"] == "service_healthy"
assert dependencies["rabbitmq"]["condition"] == "service_healthy"
assert dependencies["tenant-migrations"]["condition"] == "service_completed_successfully"
assert "auto-insight-net" in migration["networks"]
'
}

test_documented_clean_startup() {
  make_workspace SERVICES=users-service up

  migration=$(wait_for_state tenant-migrations exited)
  [ "$(docker inspect -f '{{.State.ExitCode}}' "$migration")" = 0 ] || fail "tenant migration exited nonzero"
  users=$(wait_for_state users-service healthy)
  postgres=$(service_id postgres)

  finished=$(docker inspect -f '{{.State.FinishedAt}}' "$migration")
  started=$(docker inspect -f '{{.State.StartedAt}}' "$users")
  python3 - "$finished" "$started" <<'PY'
from datetime import datetime
import sys

parse = lambda value: datetime.fromisoformat(value.replace("Z", "+00:00"))
if parse(sys.argv[1]) > parse(sys.argv[2]):
    raise SystemExit("users-service started before tenant migration completed")
PY

  created=$(docker exec "$postgres" psql -X -U postgres -d postgres -Atqc \
    "SELECT to_regclass('users_service.organizations') IS NOT NULL")
  [ "$created" = t ] || fail "unit-4A migration did not create users_service.organizations"

  cleanup
  test -z "$(docker ps -aq --filter "label=com.docker.compose.project=$PROJECT")" || fail "containers remain"
  test -z "$(docker volume ls -q --filter "label=com.docker.compose.project=$PROJECT")" || fail "volumes remain"
  test -z "$(docker network ls -q --filter "label=com.docker.compose.project=$PROJECT")" || fail "networks remain"
}

test_makefile_contract
test_effective_config
test_documented_clean_startup
printf 'PASS: Makefile Compose contract, bounded retry, dependency, clean startup, and cleanup\n'
