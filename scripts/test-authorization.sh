#!/bin/sh
# Test suite for authorization/audit backend policy (unit 5).
# Runs focused Go tests for:
#   1. Decision types and authorization data model
#   2. RBAC policy: correct permission, missing permission, forged context
#   3. Tenant isolation (cross-tenant access denied)
#   4. Dedicated mode enforcement
#   5. Fail-closed policy (panic -> deny)
#   6. Audit log: record and query entries
#   7. AuditMiddleware: wraps policy + audit, records every outcome
# Requires: Go toolchain, no external services.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
BACKEND="$ROOT/workspace/backend"

pass=0
fail=0

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

r() { printf '\033[0;31m'; printf '%s' "$*"; printf '\033[0m'; }
g() { printf '\033[0;32m'; printf '%s' "$*"; printf '\033[0m'; }
y() { printf '\033[1;33m'; printf '%s' "$*"; printf '\033[0m'; }

test_pass() { pass=$((pass + 1)); printf '  %s %s\n' "$(g PASS)" "$1"; }
test_fail() { fail=$((fail + 1)); printf '  %s %s\n' "$(r FAIL)" "$1"; }

# Run go test for the platform packages with optional test filter.
go_test_platform() {
  local pkg="$1" filter="${2:-.}"
  local out
  cd "$BACKEND"
  out=$(go test -count=1 "./internal/platform/$pkg/..." -run "$filter" 2>&1) || {
    echo "$out"
    return 1
  }
  return 0
}

# Run go vet for platform packages.
go_vet_platform() {
  local pkg="$1"
  cd "$BACKEND"
  go vet "./internal/platform/$pkg/..." 2>&1 || return 1
}

# ---------------------------------------------------------------------------
# Scenario 1: Decision types and authorization data model
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 1: Data model (Decision, Resource, Principal, TenantContext) ===')"

if go_test_platform "authorization" "TestDecision_Values|TestDecision_WithReason|TestTenantContext_Construction|TestResource_Construction|TestPrincipal_Construction"; then
  test_pass "Authorization data model types compile and construct correctly"
else
  test_fail "Authorization data model"
fi

# ---------------------------------------------------------------------------
# Scenario 2: Forged/missing authority -> denial
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 2: Forged authority -> denial ===')"

if go_test_platform "authorization" "TestRBACPolicy_MissingTenantContext_ReturnsDeny|TestRBACPolicy_NilOrganizationID_ReturnsDeny"; then
  test_pass "Forged/missing authority returns Deny"
else
  test_fail "Forged authority"
fi

# ---------------------------------------------------------------------------
# Scenario 3: Missing permission -> denial
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 3: Missing permission -> denial ===')"

if go_test_platform "authorization" "TestRBACPolicy_MissingPermission_ReturnsDeny"; then
  test_pass "Missing permission returns Deny"
else
  test_fail "Missing permission"
fi

# ---------------------------------------------------------------------------
# Scenario 4: Correct permission -> allowed
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 4: Correct permission -> allowed ===')"

if go_test_platform "authorization" "TestRBACPolicy_CorrectPermission_ReturnsAllow"; then
  test_pass "Correct permission returns Allow"
else
  test_fail "Correct permission"
fi

# ---------------------------------------------------------------------------
# Scenario 5: Fail-closed on error
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 5: Fail-closed on error ===')"

if go_test_platform "authorization" "TestFailClosedPolicy_Panic_ReturnsDeny|TestFailClosedPolicy_NormalOperation_PassesThrough"; then
  test_pass "Fail-closed policy: panic returns Deny, normal passes through"
else
  test_fail "Fail-closed policy"
fi

# ---------------------------------------------------------------------------
# Scenario 6: Cross-tenant access denied
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 6: Cross-tenant access denied ===')"

if go_test_platform "authorization" "TestRBACPolicy_CrossTenantAccess_ReturnsDeny|TestRBACPolicy_SameTenant_AllowsAccess"; then
  test_pass "Cross-tenant access denied, same-tenant allowed"
else
  test_fail "Cross-tenant isolation"
fi

# ---------------------------------------------------------------------------
# Scenario 7: Dedicated mode enforcement
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 7: Dedicated mode enforcement ===')"

if go_test_platform "authorization" "TestRBACPolicy_DedicatedMode_WrongOrg_ReturnsDeny|TestRBACPolicy_DedicatedMode_CorrectOrg_Allows"; then
  test_pass "Dedicated mode: wrong org denied, correct org allowed"
else
  test_fail "Dedicated mode enforcement"
fi

# ---------------------------------------------------------------------------
# Scenario 8: Audit log record and query
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 8: Audit log record and query ===')"

if go_test_platform "audit" "TestEntry_Construction|TestMemoryAuditLog_RecordAndQuery_All"; then
  test_pass "Audit log records entries and queries all"
else
  test_fail "Audit log record/query all"
fi

if go_test_platform "audit" "TestMemoryAuditLog_QueryByActorID|TestMemoryAuditLog_QueryByOutcome|TestMemoryAuditLog_QueryByAction|TestMemoryAuditLog_QueryByOrganizationID"; then
  test_pass "Audit log queries by ActorID, Outcome, Action, OrganizationID"
else
  test_fail "Audit log filtered queries"
fi

if go_test_platform "audit" "TestMemoryAuditLog_QueryByTimeRange|TestMemoryAuditLog_QueryOutOfRange_ReturnsEmpty"; then
  test_pass "Audit log time-range queries work correctly"
else
  test_fail "Audit log time-range queries"
fi

# ---------------------------------------------------------------------------
# Scenario 9: AuditMiddleware records every outcome
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 9: AuditMiddleware records every outcome ===')"

if go_test_platform "audit" "TestAuditMiddleware_Allow_RecordsOutcome|TestAuditMiddleware_Deny_RecordsOutcome|TestAuditMiddleware_MultipleCalls_RecordsAll"; then
  test_pass "AuditMiddleware records Allow, Deny, and multiple calls"
else
  test_fail "AuditMiddleware recording"
fi

# ---------------------------------------------------------------------------
# Compilation and vet checks
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Compilation and vet ===')"

if go_vet_platform "authorization" && go_vet_platform "audit"; then
  test_pass "go vet clean for authorization and audit"
else
  test_fail "go vet"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
printf '\n'
total=$((pass + fail))
printf '%s\n' "$(y "=== Results: $pass/$total passed, $fail failed ===")"

if [ "$fail" -gt 0 ]; then
  exit 1
fi
exit 0
