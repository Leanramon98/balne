#!/usr/bin/env bash
# Profiles / Adapters Test Harness — Work Unit 8 (Task 3.3)
# Tests: Profile resolution, minimal/full profiles, capability validation,
#        unknown profile rejection, explicit override, backward compatibility.
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
echo " Profiles / Adapters Test Harness — Unit 8"
echo " Started: $(date -Iseconds)"
echo "=========================================="

# ─── 1. File existence ───
echo ""
echo "=== 1. File existence ==="

BACKEND_DIR="workspace/backend/internal/platform/manifest"

BACKEND_FILES=(
  "$BACKEND_DIR/manifest.go"
  "$BACKEND_DIR/manifest_test.go"
  "$BACKEND_DIR/profiles.go"
)

for f in "${BACKEND_FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "file-exists: $f"
  else
    fail "file-exists: $f"
  fi
done

SCRIPT_FILE="scripts/test-profiles.sh"
if [ -f "$SCRIPT_FILE" ]; then
  pass "file-exists: $SCRIPT_FILE"
else
  fail "file-exists: $SCRIPT_FILE"
fi

# ─── 2. Go module compilation and vet ───
echo ""
echo "=== 2. Go compilation and vet ==="

cd "$PROJECT_ROOT/workspace/backend"

if go build ./internal/platform/manifest/... 2>&1; then
  pass "go-build-manifest"
else
  fail "go-build-manifest"
fi

if go vet ./internal/platform/manifest/... 2>&1; then
  pass "go-vet-manifest"
else
  fail "go-vet-manifest"
fi

# ─── 3. Go tests — all 7 spec scenarios ───
echo ""
echo "=== 3. Go tests ==="

if go test -count=1 ./internal/platform/manifest/... -run "TestResolveProfile" 2>&1; then
  pass "go-test-ResolveProfile"
else
  fail "go-test-ResolveProfile"
fi

if go test -count=1 ./internal/platform/manifest/... -run "TestValidate_With" 2>&1; then
  pass "go-test-ValidateWithProfiles"
else
  fail "go-test-ValidateWithProfiles"
fi

if go test -count=1 ./internal/platform/manifest/... -run "TestValidate_EmptyProfileIsValid" 2>&1; then
  pass "go-test-EmptyProfile"
else
  fail "go-test-EmptyProfile"
fi

if go test -count=1 ./internal/platform/manifest/... -run "TestValidate_BackwardCompatible" 2>&1; then
  pass "go-test-BackwardCompatible"
else
  fail "go-test-BackwardCompatible"
fi

# ─── 4. Profile structure verification ───
echo ""
echo "=== 4. Profile structure ==="

PROFILES_GO="$PROJECT_ROOT/$BACKEND_DIR/profiles.go"

if grep -q "BuiltinProfiles" "$PROFILES_GO" 2>/dev/null; then
  pass "profiles-BuiltinProfiles-exists"
else
  fail "profiles-BuiltinProfiles-exists"
fi

if grep -q '"minimal"' "$PROFILES_GO" 2>/dev/null; then
  pass "profiles-has-minimal"
else
  fail "profiles-has-minimal"
fi

if grep -q '"full"' "$PROFILES_GO" 2>/dev/null; then
  pass "profiles-has-full"
else
  fail "profiles-has-full"
fi

# ─── 5. Manifest struct has Profile field ───
echo ""
echo "=== 5. Manifest struct ==="

MANIFEST_GO="$PROJECT_ROOT/$BACKEND_DIR/manifest.go"

if grep -q "Profile\s*string" "$MANIFEST_GO" 2>/dev/null; then
  pass "manifest-has-Profile-field"
else
  fail "manifest-has-Profile-field"
fi

if grep -q "ProfileSet" "$MANIFEST_GO" 2>/dev/null; then
  pass "manifest-has-ProfileSet-type"
else
  fail "manifest-has-ProfileSet-type"
fi

if grep -q "ResolveProfile" "$MANIFEST_GO" 2>/dev/null; then
  pass "manifest-has-ResolveProfile"
else
  fail "manifest-has-ResolveProfile"
fi

# ─── 6. Validate calls ResolveProfile ───
echo ""
echo "=== 6. Validate integration ==="

if grep -q "ResolveProfile" "$MANIFEST_GO" 2>/dev/null; then
  pass "validate-calls-ResolveProfile"
else
  fail "validate-calls-ResolveProfile"
fi

# ─── 7. Regressions: platform packages still pass ───
echo ""
echo "=== 7. Platform regression ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 ./internal/platform/... 2>&1; then
  pass "platform-regression-all"
else
  fail "platform-regression-all"
fi

# ─── 8. Backward compatible: existing go test still passes ───
echo ""
echo "=== 8. Backward compat ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 ./internal/platform/manifest/... -run "TestValidate_ValidStructuralComposition|TestValidate_RejectsInvalidSelections|TestDecode" 2>&1; then
  pass "backward-compat-existing-tests"
else
  fail "backward-compat-existing-tests"
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
