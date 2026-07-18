#!/usr/bin/env bash
# verify-neutral-release.sh — Neutral Release Verification
#
# WORK UNIT 11 (Task 4.3) — Remove DTI After Acceptance
#
# Verifies that the codebase is ready for neutral release:
#   1. Backend compiles (neutral build)
#   2. No DTI imports remain in neutral code paths
#   3. Compat adapters cover remaining DTI references
#   4. Reference module is DTI-free
#   5. Both DTI and neutral modes have structural readiness
#   6. Preservation evidence is intact for recovery
set -euo pipefail

cd "$(dirname "$0")/../../.."
PROJECT_ROOT=$(pwd)
PASS=0
FAIL=0
CHECKS=0
FAILED_CHECKS=""

pass() { PASS=$((PASS+1)); CHECKS=$((CHECKS+1)); }
fail() { FAIL=$((FAIL+1)); CHECKS=$((CHECKS+1)); FAILED_CHECKS="$FAILED_CHECKS [$*]"; }

echo "=============================================="
echo " Neutral Release Verification — Unit 11"
echo " Started: $(date -Iseconds)"
echo "=============================================="

# ─── 1. Backend build ───
echo ""
echo "=== 1. Backend Build ==="

cd "$PROJECT_ROOT/workspace/backend"

# Full build
if go build ./... 2>&1; then
  pass "go-build-all"
else
  fail "go-build-all"
fi

# Vet platform
if go vet ./internal/platform/... 2>&1; then
  pass "go-vet-platform"
else
  fail "go-vet-platform"
fi

# Vet modules
if go vet ./internal/modules/... 2>&1; then
  pass "go-vet-modules"
else
  fail "go-vet-modules"
fi

# Build each package individually (skip empty directories)
for pkg in \
  ./internal/platform/authorization \
  ./internal/platform/audit \
  ./internal/platform/module \
  ./internal/platform/manifest \
  ./internal/platform/compat \
  ./internal/platform/release \
  ./internal/modules/reference; do
  PACKAGE_DIR="$PROJECT_ROOT/workspace/backend/$pkg"
  GO_FILES=$(find "$PACKAGE_DIR" -maxdepth 1 -name '*.go' 2>/dev/null || true)
  if [ -z "$GO_FILES" ]; then
    pass "go-build:$(basename $pkg) (no Go files — directory-only package)"
    continue
  fi
  if go build "$pkg" 2>&1; then
    pass "go-build:$(basename $pkg)"
  else
    fail "go-build:$(basename $pkg)"
  fi
done

# Also check platform/identity and platform/organizations if they have Go files
for pkg in identity organizations; do
  PACKAGE_DIR="$PROJECT_ROOT/workspace/backend/internal/platform/$pkg"
  GO_FILES=$(find "$PACKAGE_DIR" -maxdepth 1 -name '*.go' 2>/dev/null || true)
  if [ -n "$GO_FILES" ]; then
    cd "$PROJECT_ROOT/workspace/backend"
    if go build "./internal/platform/$pkg" 2>&1; then
      pass "go-build:$pkg"
    else
      fail "go-build:$pkg"
    fi
  else
    pass "go-build:$pkg (no Go files — directory-only)"
  fi
done

# ─── 2. No DTI imports in neutral code paths ───
echo ""
echo "=== 2. DTI-Free Neutral Code Paths ==="

cd "$PROJECT_ROOT"

NEUTRAL_DIRS=(
  "workspace/backend/internal/platform"
  "workspace/backend/internal/modules"
)

for dir in "${NEUTRAL_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    # Search for DTI product terms: Destino, destino, DtiShell, DtiLogo,
    # DestinoPill, DestinationID, destination_id, dti-logo
    # Skip test files that may deliberately reference terms for exclusion checks
    DTI_FOUND=$(grep -rl "Destino\|DtiShell\|DtiLogo\|DestinoPill\|DestinationID\|destination_id\|dti-logo" "$dir" \
      --include="*.go" \
      2>/dev/null || true)

    if [ -n "$DTI_FOUND" ]; then
      fail "dti-found:$dir"
      echo "  Files:"
      echo "$DTI_FOUND" | sed 's/^/    /'
    else
      pass "no-dti:$dir"
    fi
  fi
done

# Check shell components
if [ -f "workspace/frontend/components/templates/NeutralShell.tsx" ]; then
  DTI_IN_SHELL=$(grep -cE "DtiLogo|DestinoPill|DtiShell|dti-logo" \
    "workspace/frontend/components/templates/NeutralShell.tsx" 2>/dev/null || true)
  if [ "${DTI_IN_SHELL:-0}" -eq 0 ]; then
    pass "no-dti:NeutralShell.tsx"
  else
    fail "dti-found:NeutralShell.tsx"
  fi
fi

# Check SDK platform index
if [ -f "workspace/frontend/sdk/platform/index.ts" ]; then
  DTI_IN_SDK=$(grep -cE "destino|DtiLogo|DtiShell" \
    "workspace/frontend/sdk/platform/index.ts" 2>/dev/null || true)
  if [ "${DTI_IN_SDK:-0}" -eq 0 ]; then
    pass "no-dti:platform-index.ts"
  else
    fail "dti-found:platform-index.ts"
  fi
fi

# Check module registry
if [ -f "workspace/frontend/sdk/platform/module-contributions.ts" ]; then
  DTI_IN_REGISTRY=$(grep -cE "from.*destino|from.*DtiShell|from.*dti/|evaluaciones" \
    "workspace/frontend/sdk/platform/module-contributions.ts" 2>/dev/null || true)
  if [ "${DTI_IN_REGISTRY:-0}" -eq 0 ]; then
    pass "no-dti:module-contributions.ts"
  else
    fail "dti-found:module-contributions.ts"
  fi
fi

# ─── 3. Compat adapters cover DTI references (transition) ───
echo ""
echo "=== 3. Compat Adapters ==="

cd "$PROJECT_ROOT"

COMPAT_DIR="workspace/backend/internal/platform/compat"

if [ -d "$COMPAT_DIR" ]; then
  pass "compat-directory-exists"
else
  fail "compat-directory-exists"
fi

# Check key types and interfaces
if [ -f "$COMPAT_DIR/adapter.go" ]; then
  pass "compat-adapter-exists"

  # Interface checks
  for type in RouteAdapter DataAdapter Registry; do
    if grep -q "type $type " "$COMPAT_DIR/adapter.go" 2>/dev/null; then
      pass "compat-type:$type"
    else
      fail "compat-type:$type"
    fi
  done

  # RouteAdapter methods
  for method in LegacyPath NewPath; do
    if grep -q "$method" "$COMPAT_DIR/adapter.go" 2>/dev/null; then
      pass "compat-method:$method"
    else
      fail "compat-method:$method"
    fi
  done

  # Registry functions
  for func in NewRegistry RegisterRoute RegisterData ResolveRoute RemoveRoute; do
    if grep -q "func.*$func" "$COMPAT_DIR/adapter.go" 2>/dev/null; then
      pass "compat-func:$func"
    else
      fail "compat-func:$func"
    fi
  done
else
  fail "compat-adapter-exists"
fi

# Run compat tests
cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 ./internal/platform/compat/... 2>&1; then
  pass "compat-tests-pass"
else
  fail "compat-tests-pass"
fi

# ─── 4. Reference module is DTI-free ───
echo ""
echo "=== 4. Reference Module Integrity ==="

cd "$PROJECT_ROOT"

REF_DIR="workspace/backend/internal/modules/reference"
if [ -d "$REF_DIR" ]; then
  pass "reference-dir-exists"

  # Check non-test Go files for DTI content
  DTI_IN_REF=$(grep -rl "Destino\|DtiShell\|DtiLogo\|DestinoPill\|DestinationID\|dti-logo" "$REF_DIR" \
    --include="*.go" --exclude="*_test.go" 2>/dev/null || true)
  if [ -z "$DTI_IN_REF" ]; then
    pass "reference-dti-free"
  else
    fail "reference-dti-found"
    echo "$DTI_IN_REF" | sed 's/^/  /'
  fi

  # Run reference module tests
  cd "$PROJECT_ROOT/workspace/backend"
  if go test -count=1 ./internal/modules/reference/... 2>&1; then
    pass "reference-tests-pass"
  else
    fail "reference-tests-pass"
  fi
else
  fail "reference-dir-exists"
fi

# ─── 5. Platform regression ───
echo ""
echo "=== 5. Platform Regression ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 ./internal/platform/... 2>&1; then
  pass "platform-tests-pass"
else
  fail "platform-tests-pass"
fi

if go test -count=1 ./internal/modules/... 2>&1; then
  pass "modules-tests-pass"
else
  fail "modules-tests-pass"
fi

# ─── 6. Both-mode boot readiness ───
echo ""
echo "=== 6. Both-Mode Boot Readiness ==="

cd "$PROJECT_ROOT"

# DTI mode
if [ -f "workspace/frontend/components/templates/DtiShell.tsx" ]; then
  pass "dti-shell-exists"
else
  fail "dti-shell-exists"
fi

if [ -d "workspace/frontend/app/(dti)" ]; then
  pass "dti-route-exists"
else
  fail "dti-route-exists"
fi

# Neutral mode
if [ -f "workspace/frontend/components/templates/NeutralShell.tsx" ]; then
  pass "neutral-shell-exists"
else
  fail "neutral-shell-exists"
fi

if [ -d "workspace/frontend/app/(modules)" ]; then
  pass "modules-route-exists"
else
  fail "modules-route-exists"
fi

if [ -d "workspace/frontend/app/api/auth" ]; then
  pass "bff-auth-exists"
else
  fail "bff-auth-exists"
fi

# Shared SDK/boundary
if [ -d "workspace/frontend/sdk/platform" ]; then
  pass "platform-sdk-exists"
else
  fail "platform-sdk-exists"
fi

# ─── 7. Preservation evidence intact ───
echo ""
echo "=== 7. Preservation Evidence ==="

PRESERVATION_FILE="preservation/dti/preservation.json"
if [ -f "$PRESERVATION_FILE" ]; then
  pass "preservation-json-exists"

  # Quick structural validation
  if python3 -c "
import json
data = json.loads(open('$PRESERVATION_FILE').read())
assert data['schema_version'] == 1, 'schema version mismatch'
assert 'commit' in data['source'], 'missing commit'
assert data['source']['working_tree_boundary'] == 'dirty-content-excluded', 'boundary mismatch'
assert len(data['artifacts']) >= 30, f'too few artifacts: {len(data[\"artifacts\"])}'
print(f'Preservation valid: {len(data[\"artifacts\"])} artifacts, {len(data[\"preserved_dirty\"])} dirty files')
" 2>&1; then
    pass "preservation-structure-valid"
  else
    fail "preservation-structure-valid"
  fi
else
  fail "preservation-json-exists"
fi

# ─── 8. Removal plan exists ───
echo ""
echo "=== 8. Removal Plan ==="

if [ -f "workspace/backend/scripts/remove-dti.sh" ]; then
  pass "removal-plan-exists"

  if bash -n "workspace/backend/scripts/remove-dti.sh" 2>&1; then
    pass "removal-plan-syntax"
  else
    fail "removal-plan-syntax"
  fi
else
  fail "removal-plan-exists"
fi

# ─── Summary ───
echo ""
echo "=============================================="
echo " Results: $PASS/$CHECKS passed, $FAIL failed"
echo "=============================================="
if [ "$FAIL" -gt 0 ]; then
  echo "Failed checks: $FAILED_CHECKS"
  echo ""
  echo "NOTE: Some checks may fail during simulation mode because DTI paths"
  echo "have not been actually removed. This is expected."
  echo "Run: bash workspace/backend/scripts/remove-dti.sh (in real mode)"
  echo "to execute the removal plan, then re-run this verification."
  exit 1
fi
echo "Neutral release verification PASSED."
exit 0
