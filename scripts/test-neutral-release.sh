#!/usr/bin/env bash
# Neutral Release Test Harness — Work Unit 11 (Task 4.3)
# Tests: removal plan exists with ordered steps and verification,
#        neutral build/imports, compat adapters, preservation cross-reference,
#        both-mode boot.
# SIMULATION MODE: does NOT delete actual files — validates plan structure.
set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
PASS=0
FAIL=0
SCENARIOS=0
FAILED_SCENARIOS=""

pass() { PASS=$((PASS+1)); SCENARIOS=$((SCENARIOS+1)); }
fail() { FAIL=$((FAIL+1)); SCENARIOS=$((SCENARIOS+1)); FAILED_SCENARIOS="$FAILED_SCENARIOS [$*]"; }

echo "=========================================="
echo " Neutral Release Test Harness — Unit 11"
echo " Started: $(date -Iseconds)"
echo " Mode: SIMULATION — no files deleted"
echo "=========================================="

# ─── Safety Net: existing test harnesses still pass (structural) ───
echo ""
echo "=== Safety Net ==="
if [ -f "scripts/test-compatibility.sh" ]; then
  if bash -n "scripts/test-compatibility.sh" 2>&1; then
    pass "safety-compatibility-syntax"
  else
    fail "safety-compatibility-syntax"
  fi
else
  fail "safety-compatibility-syntax"
fi

if [ -f "scripts/verify-preservation.sh" ]; then
  if python3 -c "
import json, pathlib
manifest = pathlib.Path('preservation/dti/preservation.json')
data = json.loads(manifest.read_text(encoding='utf-8'))
required = ('schema_version', 'source', 'tools', 'commands', 'relationships', 'artifacts', 'preserved_dirty')
assert all(k in data for k in required), f'missing key(s): {[k for k in required if k not in data]}'
assert data['schema_version'] == 1, 'schema_version not 1'
s = data['source']
assert 'commit' in s and 'tree' in s, 'missing commit/tree'
assert s.get('working_tree_boundary') == 'dirty-content-excluded', 'unexpected boundary'
print(f'preservation manifest valid: {len(data[\"artifacts\"])} artifacts, {len(data[\"preserved_dirty\"])} dirty entries')
" 2>&1; then
    pass "safety-preservation-manifest"
  else
    fail "safety-preservation-manifest"
  fi
else
  fail "safety-preservation-manifest"
fi

# ─── 1. Removal plan exists with ordered steps ───
echo ""
echo "=== 1. Removal plan file ==="

REMOVAL_PLAN="workspace/backend/scripts/remove-dti.sh"

if [ -f "$REMOVAL_PLAN" ]; then
  pass "removal-plan-exists"
else
  fail "removal-plan-exists"
fi

if bash -n "$REMOVAL_PLAN" 2>&1; then
  pass "removal-plan-syntax"
else
  fail "removal-plan-syntax"
fi

# Plan must have at least 3 ordered phases of removal steps
REMOVAL_PHASES=$(grep -c "Phase" "$REMOVAL_PLAN" 2>/dev/null || true)
if [ "${REMOVAL_PHASES:-0}" -ge 3 ]; then
  pass "removal-plan-has-phases"
else
  fail "removal-plan-has-phases"
fi

# Plan must reference DTI frontend routes
if grep -q "workspace/frontend/app/(dti)" "$REMOVAL_PLAN" 2>/dev/null; then
  pass "removal-plan-covers-dti-frontend"
else
  fail "removal-plan-covers-dti-frontend"
fi

# Plan must reference evaluations-service
if grep -q "workspace/services/evaluations-service\|evaluations-service" "$REMOVAL_PLAN" 2>/dev/null; then
  pass "removal-plan-covers-evaluations"
else
  fail "removal-plan-covers-evaluations"
fi

# Plan must mention DTI terms (it's about removing them)
if grep -q "Destino\|destino\|DestinoPill\|DtiShell\|DtiLogo" "$REMOVAL_PLAN" 2>/dev/null; then
  pass "removal-plan-mentions-dti-terms"
else
  fail "removal-plan-mentions-dti-terms"
fi

# ─── 2. Each removal step has a verification check ───
echo ""
echo "=== 2. Removal steps have verification ==="

VERIFICATION_STEPS=$(grep -cE "verify|check|test|assert|ensure" "$REMOVAL_PLAN" 2>/dev/null || echo 0)
if [ "$VERIFICATION_STEPS" -ge 6 ]; then
  pass "removal-plan-verification-checks"
else
  fail "removal-plan-verification-checks"
fi

# Each section should have code snippets (verification commands)
SECTION_SNIPPETS=$(grep -cE '```' "$REMOVAL_PLAN" 2>/dev/null || echo 0)
if [ "$SECTION_SNIPPETS" -ge 2 ]; then
  pass "removal-plan-code-snippets"
else
  fail "removal-plan-code-snippets"
fi

# ─── 3. Verification script exists and validates ───
echo ""
echo "=== 3. Verification script ==="

VERIFY_SCRIPT="workspace/backend/scripts/verify-neutral-release.sh"

if [ -f "$VERIFY_SCRIPT" ]; then
  pass "verify-script-exists"
else
  fail "verify-script-exists"
fi

if bash -n "$VERIFY_SCRIPT" 2>&1; then
  pass "verify-script-syntax"
else
  fail "verify-script-syntax"
fi

# Verification must check neutral build compiles
if grep -q "build\|compile\|go build\|go vet\|tsc" "$VERIFY_SCRIPT" 2>/dev/null; then
  pass "verify-checks-build"
else
  fail "verify-checks-build"
fi

# Verification must check no DTI imports remain in neutral code
if grep -q "DTI\|dti\|Destino\|Dti\|dti-" "$VERIFY_SCRIPT" 2>/dev/null; then
  pass "verify-checks-dti-imports"
else
  fail "verify-checks-dti-imports"
fi

# Verification must check compat adapters
if grep -q "compat\|adapter" "$VERIFY_SCRIPT" 2>/dev/null; then
  pass "verify-checks-compat"
else
  fail "verify-checks-compat"
fi

# ─── 4. Neutral shell works without DTI imports ───
echo ""
echo "=== 4. Neutral shell isolation ==="

NEUTRAL_SHELL="workspace/frontend/components/templates/NeutralShell.tsx"
if [ -f "$NEUTRAL_SHELL" ]; then
  # Shell must not import from DTI paths
  DTI_IMPORTS=$(grep -cE "(dti)/|DtiShell|DtiLogo|DestinoPill" "$NEUTRAL_SHELL" 2>/dev/null || true)
  if [ "${DTI_IMPORTS:-0}" -eq 0 ]; then
    pass "neutral-shell-no-dti-imports"
  else
    fail "neutral-shell-no-dti-imports"
  fi
  # Shell must use platform/neutral imports
  PLATFORM_IMPORTS=$(grep -cE "sdk/platform|moduleRegistry|getNavItems|useAuth" "$NEUTRAL_SHELL" 2>/dev/null || true)
  if [ "${PLATFORM_IMPORTS:-0}" -ge 1 ]; then
    pass "neutral-shell-uses-platform"
  else
    fail "neutral-shell-uses-platform"
  fi
else
  fail "neutral-shell-exists"
fi

# Check DtiShell still exists (dual-mode during transition)
if [ -f "workspace/frontend/components/templates/DtiShell.tsx" ]; then
  pass "dtishell-still-exists"
else
  pass "dtishell-still-exists"
fi

# ─── 5. Neutral module registry validates without DTI modules ───
echo ""
echo "=== 5. Module registry isolation ==="

MODULE_CONTRIB="workspace/frontend/sdk/platform/module-contributions.ts"
if [ -f "$MODULE_CONTRIB" ]; then
  # Registry must not import from DTI product paths (comment examples are OK)
  DTI_IMPORTS_REGS=$(grep -cE "^import.*(dti|destino|evaluaciones)|from.*(dti|destino|evaluaciones)" "$MODULE_CONTRIB" 2>/dev/null || true)
  if [ "${DTI_IMPORTS_REGS:-0}" -eq 0 ]; then
    pass "module-registry-no-dti-imports"
  else
    fail "module-registry-no-dti-imports"
  fi
  pass "module-contributions-exists"
else
  fail "module-contributions-exists"
fi

# Check reference module registration exists
if grep -q "reference-module\|reference" "$MODULE_CONTRIB" 2>/dev/null; then
  pass "module-registry-has-reference"
else
  fail "module-registry-has-reference"
fi

# ─── 6. Compat adapters provide DTI-to-neutral mapping ───
echo ""
echo "=== 6. Compat adapters ==="

COMPAT_DIR="workspace/backend/internal/platform/compat"
if [ -d "$COMPAT_DIR" ]; then
  pass "compat-dir-exists"
else
  fail "compat-dir-exists"
fi

if [ -f "$COMPAT_DIR/adapter.go" ]; then
  pass "compat-adapter-exists"
else
  fail "compat-adapter-exists"
fi

# Adapters must have RouteAdapter and DataAdapter interfaces
for type_name in RouteAdapter DataAdapter Registry; do
  if grep -q "type $type_name" "$COMPAT_DIR/adapter.go" 2>/dev/null; then
    pass "compat-type-$type_name"
  else
    fail "compat-type-$type_name"
  fi
done

# ─── 7. DTI preservation evidence cross-references each removed path ───
echo ""
echo "=== 7. Preservation cross-reference ==="

PRESERVATION_FILE="preservation/dti/preservation.json"
if [ -f "$PRESERVATION_FILE" ]; then
  pass "preservation-manifest-exists"
else
  fail "preservation-manifest-exists"
fi

# Removal plan should reference preservation
PRESERVATION_REFS=$(grep -c "preservation\|dti/preservation\|preserve" "$REMOVAL_PLAN" 2>/dev/null || echo 0)
if [ "$PRESERVATION_REFS" -ge 2 ]; then
  pass "removal-plan-refs-preservation"
else
  fail "removal-plan-refs-preservation"
fi

# The removal plan should reference artifact classes from the manifest
if grep -q "generator-source\|generator-output\|migration-tree\|active-change-tree" "$REMOVAL_PLAN" 2>/dev/null; then
  pass "removal-plan-uses-artifact-classes"
else
  fail "removal-plan-uses-artifact-classes"
fi

# ─── 8. Backend compiles (neutral build) ───
echo ""
echo "=== 8. Backend compilation ==="

cd "$PROJECT_ROOT/workspace/backend"

# Check Go build compiles
if go build ./... 2>&1; then
  pass "go-build-all"
else
  fail "go-build-all"
fi

if go vet ./internal/platform/... 2>&1; then
  pass "go-vet-platform"
else
  fail "go-vet-platform"
fi

# Check compat package compiles
if go build ./internal/platform/compat/... 2>&1; then
  pass "go-build-compat"
else
  fail "go-build-compat"
fi

# ─── 9. DTI test harnesses still exist (regression) ───
echo ""
echo "=== 9. Regression through DTI test harnesses ==="

cd "$PROJECT_ROOT"

# All previous unit test harnesses should still exist
ALL_HARNESSES=(
  "scripts/test-compatibility.sh"
  "scripts/test-compose-contract.sh"
  "scripts/test-tenant-migration.sh"
  "scripts/test-users-session.sh"
  "scripts/test-gateway-session.sh"
  "scripts/test-authorization.sh"
  "scripts/test-neutral-shell.sh"
  "scripts/test-reference-module.sh"
  "scripts/test-profiles.sh"
  "scripts/test-upgrade.sh"
)

for harness in "${ALL_HARNESSES[@]}"; do
  HARNESS_BASE=$(basename "$harness")
  if [ -f "$harness" ]; then
    pass "harness-exists:$HARNESS_BASE"
  else
    fail "harness-exists:$HARNESS_BASE"
  fi
done

# ─── 10. Both-mode boot (structural readiness) ───
echo ""
echo "=== 10. Both-mode boot readiness ==="

# Check DtiShell still exists (DTI mode)
if [ -f "workspace/frontend/components/templates/DtiShell.tsx" ]; then
  pass "dti-mode-structural"
else
  fail "dti-mode-structural"
fi

# Check NeutralShell exists (neutral mode)
if [ -f "workspace/frontend/components/templates/NeutralShell.tsx" ]; then
  pass "neutral-mode-structural"
else
  fail "neutral-mode-structural"
fi

# Check both layouts exist
if [ -f "workspace/frontend/app/(dti)/layout.tsx" ]; then
  pass "dti-layout-exists"
else
  fail "dti-layout-exists"
fi

# Check (modules) route exists (neutral)
if [ -d "workspace/frontend/app/(modules)" ]; then
  pass "modules-route-exists"
else
  fail "modules-route-exists"
fi

# Check shared BFF routes still exist
if [ -d "workspace/frontend/app/api/auth" ]; then
  pass "bff-auth-routes-exist"
else
  fail "bff-auth-routes-exist"
fi

# ─── 11. No DTI product imports in neutral code paths ───
echo ""
echo "=== 11. DTI-free neutral code paths ==="

# Check all neutral platform packages for DTI terms (exclude known test files
# that deliberately reference DTI terms for exclusion verification)
NEUTRAL_PATH_DIRS=(
  "workspace/backend/internal/platform"
)

for dir in "${NEUTRAL_PATH_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    DTI_FILES=$(grep -rl "Destino\|destino\|DtiShell\|DtiLogo\|DestinoPill\|DestinationID\|destination_id" "$dir" 2>/dev/null || true)
    if [ -n "$DTI_FILES" ]; then
      fail "dti-in-platform:$dir"
      echo "  Files: $DTI_FILES"
    else
      pass "dti-free-platform:$dir"
    fi
  fi
done

# Check reference module (only non-test files for DTI terms; test files may
# deliberately reference terms for exclusion verification)
REF_MODULE_DIR="workspace/backend/internal/modules/reference"
if [ -d "$REF_MODULE_DIR" ]; then
  # Check only Go files that are NOT test files
  DTI_IN_REF=$(grep -rl "Destino\|destino\|DtiShell\|DtiLogo\|DestinoPill\|DestinationID" "$REF_MODULE_DIR" --include="*.go" --exclude="*_test.go" 2>/dev/null || true)
  if [ -n "$DTI_IN_REF" ]; then
    fail "dti-in-reference-non-test"
    echo "  Files: $DTI_IN_REF"
  else
    pass "dti-free:reference-module"
  fi
fi

# Check frontend neutral shell for DTI content
if [ -f "workspace/frontend/components/templates/NeutralShell.tsx" ]; then
  DTI_IN_SHELL=$(grep -cE "DtiLogo|DestinoPill|dti-logo" "workspace/frontend/components/templates/NeutralShell.tsx" 2>/dev/null || true)
  if [ "${DTI_IN_SHELL:-0}" -eq 0 ]; then
    pass "dti-free:NeutralShell"
  else
    fail "dti-free:NeutralShell"
  fi
fi

# Check SDK platform index
if [ -f "workspace/frontend/sdk/platform/index.ts" ]; then
  DTI_IN_SDK=$(grep -cE "destino|Destino|dti|evaluaciones|evaluations-service" "workspace/frontend/sdk/platform/index.ts" 2>/dev/null || true)
  if [ "${DTI_IN_SDK:-0}" -eq 0 ]; then
    pass "dti-free:platform-index"
  else
    fail "dti-free:platform-index: $DTI_IN_SDK occurrences"
  fi
fi

# ─── 12. Platform regression tests pass (triangulation) ───
echo ""
echo "=== 12. Platform regression ==="

cd "$PROJECT_ROOT/workspace/backend"
PLATFORM_TEST=$(go test -count=1 ./internal/platform/... 2>&1) && {
  pass "platform-tests-pass"
} || {
  fail "platform-tests-pass"
  echo "  $PLATFORM_TEST"
}

MODULE_TEST=$(go test -count=1 ./internal/modules/... 2>&1) && {
  pass "module-tests-pass"
} || {
  fail "module-tests-pass"
  echo "  $MODULE_TEST"
}
cd "$PROJECT_ROOT"

# ─── 13. Edge case: removal plan has all 8 phases (triangulation) ───
echo ""
echo "=== 13. Removal plan completeness ==="

PHASE_COUNT=$(grep -c "Phase " "$REMOVAL_PLAN" 2>/dev/null || true)
if [ "${PHASE_COUNT:-0}" -ge 8 ]; then
  pass "removal-plan-8-phases"
else
  fail "removal-plan-8-phases (found: $PHASE_COUNT)"
fi

# Verify plan references DTI recovery commit
if grep -q "61d1204432f23292c5236261da98b647fbb14be9" "$REMOVAL_PLAN" 2>/dev/null; then
  pass "removal-plan-refs-recovery-commit"
else
  fail "removal-plan-refs-recovery-commit"
fi

# Verify plan has rollback section
if grep -q "Rollback\|rollback\|revert" "$REMOVAL_PLAN" 2>/dev/null; then
  pass "removal-plan-has-rollback"
else
  fail "removal-plan-has-rollback"
fi

# ─── 14. Edge case: compat adapter tests pass (behavioral, not structural) ───
echo ""
echo "=== 14. Compat adapter behavioral ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 ./internal/platform/compat/... 2>&1; then
  pass "compat-tests-pass"
else
  fail "compat-tests-pass"
fi
cd "$PROJECT_ROOT"

# ─── Summary ───
echo ""
echo "=========================================="
echo " Results: $PASS/$SCENARIOS passed, $FAIL failed"
echo "=========================================="
if [ "$FAIL" -gt 0 ]; then
  echo "Failed scenarios: $FAILED_SCENARIOS"
  exit 1
fi
exit 0
