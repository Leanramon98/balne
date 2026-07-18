#!/usr/bin/env bash
# Compatibility Adapter Test Harness — Work Unit 10 (Task 4.2)
# Tests: RouteAdapter/DataAdapter interfaces, registry, round-trip,
#        empty/null handling, unknown routes, composition, removal safety.
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
echo " Compatibility Adapter Test Harness — Unit 10"
echo " Started: $(date -Iseconds)"
echo "=========================================="

# ─── 1. File existence ───
echo ""
echo "=== 1. File existence ==="

COMPAT_DIR="workspace/backend/internal/platform/compat"

COMPAT_FILES=(
  "$COMPAT_DIR/adapter.go"
  "$COMPAT_DIR/adapter_test.go"
)

for f in "${COMPAT_FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "file-exists: $f"
  else
    fail "file-exists: $f"
  fi
done

SCRIPT_FILE="scripts/test-compatibility.sh"
if [ -f "$SCRIPT_FILE" ]; then
  pass "file-exists: $SCRIPT_FILE"
else
  fail "file-exists: $SCRIPT_FILE"
fi

# ─── 2. Go module compilation and vet ───
echo ""
echo "=== 2. Go compilation and vet ==="

cd "$PROJECT_ROOT/workspace/backend"

if go build ./internal/platform/compat/... 2>&1; then
  pass "go-build-compat"
else
  fail "go-build-compat"
fi

if go vet ./internal/platform/compat/... 2>&1; then
  pass "go-vet-compat"
else
  fail "go-vet-compat"
fi

# ─── 3. Scenario 1: Legacy route maps to new handler path ───
echo ""
echo "=== 3. Scenario 1: Legacy route maps to new handler path ==="

if go test -count=1 ./internal/platform/compat/... -run "TestRegisterRoute_Resolves" 2>&1; then
  pass "scenario-1-legacy-route-mapped"
else
  fail "scenario-1-legacy-route-mapped"
fi

# ─── 4. Scenario 2: Legacy data model maps to neutral fields ───
echo ""
echo "=== 4. Scenario 2: Legacy data model maps to neutral fields ==="

if go test -count=1 ./internal/platform/compat/... -run "TestMultipleAdapters_ComposeWithoutCollision" 2>&1; then
  pass "scenario-2-legacy-data-mapped"
else
  fail "scenario-2-legacy-data-mapped"
fi

# ─── 5. Scenario 3: Adapter handles empty/null legacy fields ───
echo ""
echo "=== 5. Scenario 3: Empty/null handling ==="

if go test -count=1 ./internal/platform/compat/... -run "TestEmptyLegacyData_AdaptHandlesGracefully" 2>&1; then
  pass "scenario-3a-empty-adapt-handled"
else
  fail "scenario-3a-empty-adapt-handled"
fi

if go test -count=1 ./internal/platform/compat/... -run "TestEmptyLegacyData_RevertHandlesGracefully" 2>&1; then
  pass "scenario-3b-empty-revert-handled"
else
  fail "scenario-3b-empty-revert-handled"
fi

# ─── 6. Scenario 4: Unknown legacy route returns false (404), not error ───
echo ""
echo "=== 6. Scenario 4: Unknown route returns false ==="

if go test -count=1 ./internal/platform/compat/... -run "TestResolveRoute_UnknownReturns404" 2>&1; then
  pass "scenario-4-unknown-route-returns-false"
else
  fail "scenario-4-unknown-route-returns-false"
fi

# ─── 7. Scenario 5: Multiple adapters compose without collision ───
echo ""
echo "=== 7. Scenario 5: Multiple adapters compose ==="

if go test -count=1 ./internal/platform/compat/... -run "TestMultipleAdapters_ComposeWithoutCollision" 2>&1; then
  pass "scenario-5-multiple-adapters-compose"
else
  fail "scenario-5-multiple-adapters-compose"
fi

if go test -count=1 ./internal/platform/compat/... -run "TestRegisterRoute_CollisionRejected" 2>&1; then
  pass "scenario-5-collision-rejected"
else
  fail "scenario-5-collision-rejected"
fi

# ─── 8. Scenario 6: Adapter removal doesn't break remaining routes ───
echo ""
echo "=== 8. Scenario 6: Removal safety ==="

if go test -count=1 ./internal/platform/compat/... -run "TestRemoveRoute_DoesNotBreakRemaining" 2>&1; then
  pass "scenario-6a-route-removal-safe"
else
  fail "scenario-6a-route-removal-safe"
fi

if go test -count=1 ./internal/platform/compat/... -run "TestRemoveData_DoesNotBreakRemaining" 2>&1; then
  pass "scenario-6b-data-removal-safe"
else
  fail "scenario-6b-data-removal-safe"
fi

# ─── 9. Scenario 7: Full round-trip preserves data ───
echo ""
echo "=== 9. Scenario 7: Round-trip preserves data ==="

if go test -count=1 ./internal/platform/compat/... -run "TestRoundTrip_PreservesData" 2>&1; then
  pass "scenario-7-round-trip-preserves-data"
else
  fail "scenario-7-round-trip-preserves-data"
fi

# ─── 10. All compat tests pass ───
echo ""
echo "=== 10. All compat tests ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 -v ./internal/platform/compat/... 2>&1; then
  pass "all-compat-tests-pass"
else
  fail "all-compat-tests-pass"
fi

# ─── 11. Platform regression: existing packages still pass ───
echo ""
echo "=== 11. Platform regression ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 ./internal/platform/... 2>&1; then
  pass "platform-regression-all"
else
  fail "platform-regression-all"
fi

# ─── 12. Key types exist in adapter.go ───
echo ""
echo "=== 12. Type verification ==="

COMPAT_GO="$PROJECT_ROOT/$COMPAT_DIR/adapter.go"

for type_name in RouteAdapter DataAdapter Registry; do
  if grep -q "type $type_name" "$COMPAT_GO" 2>/dev/null; then
    pass "type-exists: $type_name"
  else
    fail "type-exists: $type_name"
  fi
done

for iface_method in LegacyPath NewPath SourceType Adapt Revert; do
  if grep -q "$iface_method" "$COMPAT_GO" 2>/dev/null; then
    pass "interface-method: $iface_method"
  else
    fail "interface-method: $iface_method"
  fi
done

for func_name in NewRegistry RegisterRoute RegisterData ResolveRoute AdaptData RevertData RemoveRoute RemoveData; do
  if grep -q "func.*$func_name" "$COMPAT_GO" 2>/dev/null; then
    pass "func-exists: $func_name"
  else
    fail "func-exists: $func_name"
  fi
done

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
