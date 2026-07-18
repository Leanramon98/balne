#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MODE=full
if [ "${1:-}" = "--source-only" ]; then MODE=source-only; shift; fi
MANIFEST=${1:-"$ROOT/preservation/dti/preservation.json"}

python3 - "$ROOT" "$MANIFEST" "$MODE" <<'PY'
import hashlib
import json
import pathlib
import re
import subprocess
import sys

root = pathlib.Path(sys.argv[1])
manifest = pathlib.Path(sys.argv[2])
mode = sys.argv[3]

def fail(message):
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)

try:
    data = json.loads(manifest.read_text(encoding="utf-8"))
except (OSError, UnicodeError, json.JSONDecodeError):
    fail("malformed preservation metadata")

required = ("schema_version", "source", "tools", "commands", "relationships", "artifacts", "preserved_dirty")
if not isinstance(data, dict) or any(key not in data for key in required):
    fail("missing required metadata")
source = data["source"]
def valid_sha256(value):
    return isinstance(value, str) and bool(re.fullmatch(r"[0-9a-f]{64}", value))

if data["schema_version"] != 1 or not isinstance(source, dict):
    fail("missing required metadata")
if not re.fullmatch(r"[0-9a-f]{40}", source.get("commit", "")) or not re.fullmatch(r"[0-9a-f]{40}", source.get("tree", "")):
    fail("missing required metadata")
if source.get("working_tree_boundary") != "dirty-content-excluded":
    fail("missing required metadata")
if not isinstance(source.get("dirty_boundary_count"), int) or not valid_sha256(source.get("dirty_boundary_sha256")):
    fail("missing required metadata")
def nonempty_list(value):
    return isinstance(value, list) and bool(value)

for key in ("tools", "commands", "relationships", "artifacts", "preserved_dirty"):
    if not nonempty_list(data[key]):
        fail("missing required metadata")

def git(*args):
    return subprocess.run(["git", *args], cwd=root, text=True, capture_output=True)

commit = source["commit"]
resolved = git("rev-parse", f"{commit}^{{tree}}")
if resolved.returncode or resolved.stdout.strip() != source["tree"]:
    fail("source commit/tree boundary mismatch")

def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def tree_hash(path):
    digest = hashlib.sha256()
    files = sorted(item for item in path.rglob("*") if item.is_file())
    for item in files:
        relative = item.relative_to(path).as_posix()
        digest.update(relative.encode() + b"\0" + file_hash(item).encode() + b"\n")
    return digest.hexdigest()

classes = {"generator-source", "generator-output", "migration-tree", "active-change-tree"}
inventory = {}
for artifact in data["artifacts"]:
    path_value = artifact.get("path") if isinstance(artifact, dict) else None
    kind = artifact.get("kind") if isinstance(artifact, dict) else None
    expected = artifact.get("sha256") if isinstance(artifact, dict) else None
    if (not isinstance(path_value, str) or not path_value or pathlib.PurePosixPath(path_value).is_absolute()
            or ".." in pathlib.PurePosixPath(path_value).parts or kind not in {"file", "tree"}
            or artifact.get("class") not in classes or not valid_sha256(expected)):
        fail("invalid artifact metadata")
    path = root / path_value
    if (kind == "file" and not path.is_file()) or (kind == "tree" and not path.is_dir()):
        fail(f"artifact missing or wrong type: {path_value}")
    actual = tree_hash(path) if kind == "tree" else file_hash(path)
    if actual != expected:
        fail(f"hash mismatch: {path_value}")
    inventory[path_value] = artifact["class"]

for relation in data["relationships"]:
    if not nonempty_list(relation.get("sources")) or not nonempty_list(relation.get("outputs")):
        fail("missing required metadata")
    if any(inventory.get(path) != "generator-source" for path in relation.get("sources", [])):
        fail("invalid generator source/output classification")
    if any(inventory.get(path) != "generator-output" for path in relation.get("outputs", [])):
        fail("invalid generator source/output classification")

dirty_canonical = json.dumps(sorted(data["preserved_dirty"], key=lambda item: item.get("path", "")), sort_keys=True, separators=(",", ":"))
dirty_digest = hashlib.sha256(dirty_canonical.encode()).hexdigest()
if len(data["preserved_dirty"]) != source["dirty_boundary_count"] or dirty_digest != source["dirty_boundary_sha256"]:
    fail("dirty boundary digest mismatch")
if mode == "source-only":
    print(f"PASS: source recovery metadata and {len(inventory)} artifacts verified; dirty boundary metadata retained but original state not asserted")
    raise SystemExit(0)

for entry in data["preserved_dirty"]:
    path = entry.get("path", "")
    state = git("status", "--porcelain=v1", "--untracked-files=all", "--", path).stdout[:2]
    if state != entry.get("status"):
        fail(f"dirty-state mismatch: {path}")
    if state == "??" and file_hash(root / path) != entry.get("sha256"):
        fail(f"hash mismatch: {path}")
    if state == " D":
        blob = subprocess.run(["git", "show", f"{commit}:{path}"], cwd=root, capture_output=True)
        if blob.returncode or hashlib.sha256(blob.stdout).hexdigest() != entry.get("head_sha256"):
            fail(f"hash mismatch: {path}")

print(f"PASS: preservation metadata, {len(inventory)} artifacts, and {len(data['preserved_dirty'])} dirty entries verified")
PY
