#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
HARNESS="$ROOT/scripts/test-architecture.sh"
FIXTURE="$ROOT/tests/architecture/characterization.json"

[ -x "$HARNESS" ] || { echo "FAIL: architecture harness is missing or not executable" >&2; exit 1; }
"$HARNESS" "$FIXTURE"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
python3 - "$FIXTURE" "$tmp" <<'PY'
import json
import pathlib
import sys

source = json.load(open(sys.argv[1], encoding="utf-8"))
out = pathlib.Path(sys.argv[2])
variants = {
    "stale.json": lambda item: item["file_checks"][0].update(sha256="0" * 64),
    "missing.json": lambda item: item["file_checks"].pop(),
    "violation.json": lambda item: item["forbidden_checks"][0].update(forbidden=["useDestino"]),
}
for name, mutate in variants.items():
    candidate = json.loads(json.dumps(source))
    mutate(candidate)
    (out / name).write_text(json.dumps(candidate), encoding="utf-8")
PY

expect_failure() {
  label=$1 expected=$2 fixture=$3
  output=$("$HARNESS" "$fixture" 2>&1) && { echo "FAIL: $label unexpectedly passed" >&2; exit 1; }
  printf '%s' "$output" | grep -F "$expected" >/dev/null || {
    echo "FAIL: $label did not report '$expected'" >&2
    exit 1
  }
  echo "PASS: $label rejected"
}

expect_failure "stale characterization" "stale characterization" "$tmp/stale.json"
expect_failure "missing characterization" "characterization set mismatch" "$tmp/missing.json"
expect_failure "boundary violation" "boundary violation" "$tmp/violation.json"
echo "PASS: 4 architecture harness scenarios"
