#!/usr/bin/env bash
# Upgrade / Release / Drift Rollback Test Harness — Work Unit 9 (Task 4.1)
# Tests: Release manifest parsing, upgrade path validation, compatibility windows,
#        rollback restore, precondition enforcement, and drift detection.
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
echo " Upgrade / Release / Drift Test Harness — Unit 9"
echo " Started: $(date -Iseconds)"
echo "=========================================="

# ─── 1. File existence ───
echo ""
echo "=== 1. File existence ==="

RELEASE_DIR="workspace/backend/internal/platform/release"

RELEASE_FILES=(
  "$RELEASE_DIR/release.go"
  "$RELEASE_DIR/rollback.go"
  "$RELEASE_DIR/drift.go"
  "$RELEASE_DIR/release_test.go"
  "$RELEASE_DIR/rollback_test.go"
  "$RELEASE_DIR/drift_test.go"
)

for f in "${RELEASE_FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "file-exists: $f"
  else
    fail "file-exists: $f"
  fi
done

SCRIPT_FILE="scripts/test-upgrade.sh"
if [ -f "$SCRIPT_FILE" ]; then
  pass "file-exists: $SCRIPT_FILE"
else
  fail "file-exists: $SCRIPT_FILE"
fi

# ─── 2. Go module compilation and vet ───
echo ""
echo "=== 2. Go compilation and vet ==="

cd "$PROJECT_ROOT/workspace/backend"

if go build ./internal/platform/release/... 2>&1; then
  pass "go-build-release"
else
  fail "go-build-release"
fi

if go vet ./internal/platform/release/... 2>&1; then
  pass "go-vet-release"
else
  fail "go-vet-release"
fi

# ─── 3. Scenario 1: Release manifest parses ───
echo ""
echo "=== 3. Scenario 1: Release manifest parses ==="

if go test -count=1 ./internal/platform/release/... -run "TestParseRelease_ValidManifest" 2>&1; then
  pass "scenario-1-valid-manifest"
else
  fail "scenario-1-valid-manifest"
fi

if go test -count=1 ./internal/platform/release/... -run "TestParseRelease_InvalidJSON" 2>&1; then
  pass "scenario-1-invalid-json"
else
  fail "scenario-1-invalid-json"
fi

if go test -count=1 ./internal/platform/release/... -run "TestParseRelease_EmptyData" 2>&1; then
  pass "scenario-1-empty-data"
else
  fail "scenario-1-empty-data"
fi

# ─── 4. Scenario 2: Upgrade path validates ───
echo ""
echo "=== 4. Scenario 2: Upgrade path validates ==="

if go test -count=1 ./internal/platform/release/... -run "TestCheckUpgrade_ValidPath" 2>&1; then
  pass "scenario-2-valid-upgrade-path"
else
  fail "scenario-2-valid-upgrade-path"
fi

if go test -count=1 ./internal/platform/release/... -run "TestCheckUpgrade_NoPath" 2>&1; then
  pass "scenario-2-no-path"
else
  fail "scenario-2-no-path"
fi

if go test -count=1 ./internal/platform/release/... -run "TestCheckUpgrade_AlreadyCurrent" 2>&1; then
  pass "scenario-2-already-current"
else
  fail "scenario-2-already-current"
fi

# ─── 5. Scenario 3: Compatible release accepted ───
echo ""
echo "=== 5. Scenario 3: Compatible release accepted ==="

if go test -count=1 ./internal/platform/release/... -run "TestCheckCompatibility_Accepted" 2>&1; then
  pass "scenario-3-compatible-accepted"
else
  fail "scenario-3-compatible-accepted"
fi

# ─── 6. Scenario 4: Incompatible release rejected ───
echo ""
echo "=== 6. Scenario 4: Incompatible release rejected ==="

if go test -count=1 ./internal/platform/release/... -run "TestCheckCompatibility_RejectedBelow" 2>&1; then
  pass "scenario-4-rejected-below-min"
else
  fail "scenario-4-rejected-below-min"
fi

if go test -count=1 ./internal/platform/release/... -run "TestCheckCompatibility_RejectedAbove" 2>&1; then
  pass "scenario-4-rejected-above-max"
else
  fail "scenario-4-rejected-above-max"
fi

# ─── 7. Scenario 5: Rollback restores ───
echo ""
echo "=== 7. Scenario 5: Rollback restores ==="

if go test -count=1 ./internal/platform/release/... -run "TestCreateRollbackPlan" 2>&1; then
  pass "scenario-5-rollback-plan-created"
else
  fail "scenario-5-rollback-plan-created"
fi

if go test -count=1 ./internal/platform/release/... -run "TestExecuteRollback_Success" 2>&1; then
  pass "scenario-5-rollback-executed"
else
  fail "scenario-5-rollback-executed"
fi

if go test -count=1 ./internal/platform/release/... -run "TestExecuteRollback_SnapshotNotFound" 2>&1; then
  pass "scenario-5-rollback-missing-snapshot-fails"
else
  fail "scenario-5-rollback-missing-snapshot-fails"
fi

# ─── 8. Scenario 6: Upgrade preconditions fail ───
echo ""
echo "=== 8. Scenario 6: Precondition enforcement ==="

if go test -count=1 ./internal/platform/release/... -run "TestCheckUpgrade_PreconditionsFail" 2>&1; then
  pass "scenario-6-preconditions-fail"
else
  fail "scenario-6-preconditions-fail"
fi

if go test -count=1 ./internal/platform/release/... -run "TestCheckUpgrade_PreconditionsPass" 2>&1; then
  pass "scenario-6-preconditions-pass"
else
  fail "scenario-6-preconditions-pass"
fi

if go test -count=1 ./internal/platform/release/... -run "TestUpgradeStep_PreconditionsFail" 2>&1; then
  pass "scenario-6-step-preconditions-fail"
else
  fail "scenario-6-step-preconditions-fail"
fi

# ─── 9. Scenario 7: Drift detection ───
echo ""
echo "=== 9. Scenario 7: Drift detection ==="

if go test -count=1 ./internal/platform/release/... -run "TestDetectDrift_Match" 2>&1; then
  pass "scenario-7-drift-no-drift-matches"
else
  fail "scenario-7-drift-no-drift-matches"
fi

if go test -count=1 ./internal/platform/release/... -run "TestDetectDrift_DriftFound" 2>&1; then
  pass "scenario-7-drift-detected"
else
  fail "scenario-7-drift-detected"
fi

if go test -count=1 ./internal/platform/release/... -run "TestDetectDrift_MissingPath" 2>&1; then
  pass "scenario-7-drift-missing-file"
else
  fail "scenario-7-drift-missing-file"
fi

if go test -count=1 ./internal/platform/release/... -run "TestDetectDrift_ExtraPath" 2>&1; then
  pass "scenario-7-drift-extra-file"
else
  fail "scenario-7-drift-extra-file"
fi

# ─── 10. All release tests pass ───
echo ""
echo "=== 10. All release tests ==="

cd "$PROJECT_ROOT/workspace/backend"
if go test -count=1 -v ./internal/platform/release/... 2>&1; then
  pass "all-release-tests-pass"
else
  fail "all-release-tests-pass"
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

# ─── 12. Key types exist in source ───
echo ""
echo "=== 12. Type verification ==="

RELEASE_GO="$PROJECT_ROOT/$RELEASE_DIR/release.go"

for type_name in ReleaseManifest Compatibility UpgradeStep Precondition; do
  if grep -q "type $type_name struct" "$RELEASE_GO" 2>/dev/null; then
    pass "type-exists: $type_name"
  else
    fail "type-exists: $type_name"
  fi
done

for func_name in ParseRelease CheckUpgrade CheckCompatibility; do
  if grep -q "func $func_name" "$RELEASE_GO" 2>/dev/null; then
    pass "func-exists: $func_name"
  else
    fail "func-exists: $func_name"
  fi
done

ROLLBACK_GO="$PROJECT_ROOT/$RELEASE_DIR/rollback.go"

for type_name in Snapshot RollbackPlan RollbackStep SnapshotStore; do
  if grep -q "type $type_name" "$ROLLBACK_GO" 2>/dev/null; then
    pass "type-exists: $type_name"
  else
    fail "type-exists: $type_name"
  fi
done

for func_name in CreateRollbackPlan ExecuteRollback; do
  if grep -q "func $func_name" "$ROLLBACK_GO" 2>/dev/null; then
    pass "func-exists: $func_name"
  else
    fail "func-exists: $func_name"
  fi
done

DRIFT_GO="$PROJECT_ROOT/$RELEASE_DIR/drift.go"

for type_name in Drift DriftDetector; do
  if grep -q "type $type_name" "$DRIFT_GO" 2>/dev/null; then
    pass "type-exists: $type_name"
  else
    fail "type-exists: $type_name"
  fi
done

if grep -q "func DetectDrift" "$DRIFT_GO" 2>/dev/null; then
  pass "func-exists: DetectDrift"
else
  fail "func-exists: DetectDrift"
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
