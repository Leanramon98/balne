#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
FIXTURE=${1:-"$ROOT/tests/architecture/characterization.json"}

python3 - "$ROOT" "$FIXTURE" <<'PY'
import hashlib
import json
import pathlib
import re
import subprocess
import sys

root = pathlib.Path(sys.argv[1])
fixture = pathlib.Path(sys.argv[2])

def fail(message):
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)

try:
    data = json.loads(fixture.read_text(encoding="utf-8"))
except (OSError, UnicodeError, json.JSONDecodeError):
    fail("malformed architecture characterization")

groups = ("file_checks", "migration_checks", "forbidden_checks")
if data.get("schema_version") != 1 or any(not isinstance(data.get(key), list) for key in groups):
    fail("missing architecture characterization metadata")
preservation = data.get("preservation_check")
if not isinstance(preservation, dict):
    fail("missing architecture characterization metadata")

checks = [item for key in groups for item in data[key]] + [preservation]
ids = [item.get("id") for item in checks if isinstance(item, dict)]
def digest_lines(values):
    return hashlib.sha256(("\n".join(values) + "\n").encode()).hexdigest()

ids_digest = digest_lines(sorted(ids)) if all(isinstance(item, str) and item for item in ids) else ""
if len(checks) != data.get("checks_count") or ids_digest != data.get("check_ids_sha256") or len(ids) != len(set(ids)):
    fail("characterization set mismatch")

required_categories = {"login-session", "sdk-bff", "gateway-routes", "tenant-identity", "migrations", "cross-module", "recovery-generation"}
if {item.get("category") for item in checks} != required_categories:
    fail("characterization category coverage mismatch")

def sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()

for check in data["file_checks"]:
    path = root / check.get("path", "")
    if not path.is_file():
        fail(f"missing characterized file [{check.get('id')}]: {check.get('path')}")
    content = path.read_bytes()
    if sha256_bytes(content) != check.get("sha256"):
        fail(f"stale characterization [{check['id']}]: {check['path']}")
    text = content.decode("utf-8")
    for token in check.get("contains", []):
        if token not in text:
            fail(f"missing characterized evidence [{check['id']}]: {token}")
    for token in check.get("absent", []):
        if token in text:
            fail(f"unsafe condition changed [{check['id']}]: unexpected {token}")

for check in data["migration_checks"]:
    path = root / check.get("path", "")
    names = sorted(item.name for item in path.glob("*.up.sql")) if path.is_dir() else []
    if (len(names) != check.get("count") or not names or names[0] != check.get("first")
            or names[-1] != check.get("last") or digest_lines(names) != check.get("names_sha256")):
        fail(f"stale migration characterization [{check.get('id')}]")
    if any(not re.match(r"^[0-9]+_.*\.up\.sql$", name) for name in names):
        fail(f"invalid migration ordering source [{check['id']}]")

for check in data["forbidden_checks"]:
    suffixes = tuple(check.get("suffixes", []))
    for relative in check.get("roots", []):
        path = root / relative
        if not path.is_dir():
            fail(f"missing boundary root [{check.get('id')}]: {relative}")
        for candidate in sorted(item for item in path.rglob("*") if item.is_file() and item.suffix in suffixes):
            text = candidate.read_text(encoding="utf-8")
            for token in check.get("forbidden", []):
                if token in text:
                    fail(f"boundary violation [{check['id']}]: {candidate.relative_to(root)} contains {token}")

if preservation.get("command") != "scripts/verify-preservation.sh" or preservation.get("argument") != "--source-only":
    fail("invalid preservation regression command")
result = subprocess.run([str(root / preservation["command"]), preservation["argument"]], cwd=root)
if result.returncode:
    fail("DTI recovery/generated relationship regression")

print(f"PASS: {len(checks)} architecture characterizations verified")
PY
