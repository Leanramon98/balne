#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
VERIFY="$ROOT/scripts/verify-preservation.sh"
MANIFEST="$ROOT/preservation/dti/preservation.json"
FIXTURES="$ROOT/tests/preservation/fixtures"
failures=0

[ -x "$VERIFY" ] || { echo "FAIL: preservation verifier is missing or not executable" >&2; exit 1; }

expect_failure() {
  label=$1
  expected=$2
  shift 2
  if output=$("$@" 2>&1); then
    echo "FAIL: $label unexpectedly passed" >&2
    failures=$((failures + 1))
  elif ! printf '%s' "$output" | grep -F "$expected" >/dev/null; then
    echo "FAIL: $label did not report '$expected'" >&2
    failures=$((failures + 1))
  else
    echo "PASS: $label rejected"
  fi
}

"$VERIFY" "$MANIFEST"
expect_failure "malformed metadata" "malformed preservation metadata" \
  "$VERIFY" "$FIXTURES/malformed.json"
expect_failure "incomplete metadata" "missing required metadata" \
  "$VERIFY" "$FIXTURES/incomplete.json"

tmp=$(mktemp -d)
trap 'git -C "$ROOT" worktree remove --force "$tmp/recovery" >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT
python3 - "$MANIFEST" "$tmp" <<'PY'
import json
import pathlib
import sys

with open(sys.argv[1], encoding="utf-8") as source:
    data = json.load(source)
out = pathlib.Path(sys.argv[2])
variants = {
    "bad-hash.json": lambda item: item["artifacts"][0].update(sha256="0" * 64),
    "missing-artifact.json": lambda item: item["artifacts"].append({"path":"does-not-exist","kind":"file","class":"generator-output"}),
    "missing-dirty.json": lambda item: item["preserved_dirty"].pop(),
}
for name, mutate in variants.items():
    candidate = json.loads(json.dumps(data))
    mutate(candidate)
    (out / name).write_text(json.dumps(candidate), encoding="utf-8")
PY
expect_failure "tampered hash" "hash mismatch" "$VERIFY" "$tmp/bad-hash.json"
expect_failure "missing artifact metadata" "invalid artifact metadata" "$VERIFY" "$tmp/missing-artifact.json"
expect_failure "missing dirty entry" "dirty boundary digest mismatch" "$VERIFY" "$tmp/missing-dirty.json"

commit=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["source"]["commit"])' "$MANIFEST")
git -C "$ROOT" worktree add --detach "$tmp/recovery" "$commit" >/dev/null
cp -R "$ROOT/preservation" "$ROOT/scripts" "$tmp/recovery/"
if (cd "$tmp/recovery" && scripts/verify-preservation.sh --source-only); then
  echo "PASS: clean detached source recovery verified"
else
  echo "FAIL: clean detached source recovery did not verify" >&2
  failures=$((failures + 1))
fi

[ "$failures" -eq 0 ] || exit 1
echo "PASS: 7 preservation scenarios"
