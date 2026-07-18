#!/bin/sh
# Test suite for user session with neutral claims (unit 4B2).
# Runs focused Go tests for:
#   1. Neutral JWT claims serialization
#   2. LoginResponse neutral fields
#   3. Organization/Membership repository interfaces
#   4. PostAuthLogin neutral/legacy/dual/error flows
# Requires: Go toolchain, no external services.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
USERS_SERVICE="$ROOT/workspace/services/users-service"

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

# Run go test for a specific package pattern and test filter.
go_test() {
  local pkg="$1" filter="${2:-.}"
  local out
  cd "$USERS_SERVICE"
  out=$(go test -count=1 "./internal/$pkg/..." -run "$filter" 2>&1) || {
    echo "$out"
    return 1
  }
  return 0
}

# ---------------------------------------------------------------------------
# Scenario 1: Neutral JWT claims
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 1: Neutral JWT claims ===')"

if go_test "adapters/in/http" "TestNeutralClaims_Serialize"; then
  test_pass "NeutralClaims JWT serialization round-trips correctly"
else
  test_fail "NeutralClaims JWT serialization"
fi

# ---------------------------------------------------------------------------
# Scenario 2: LoginResponse neutral fields
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 2: LoginResponse neutral fields ===')"

if go_test "domain" "TestLoginResponse_NeutralFields"; then
  test_pass "LoginResponse carries neutral tenant fields"
else
  test_fail "LoginResponse neutral fields"
fi

# ---------------------------------------------------------------------------
# Scenario 3: Repository interfaces (compile-time)
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 3: Repository interfaces ===')"

if go_test "usecases" "TestPostAuthLogin"; then
  test_pass "OrganizationRepository/MembershipRepository interfaces satisfied"
else
  test_fail "Repository interfaces"
fi

# ---------------------------------------------------------------------------
# Scenario 4: Neutral login with org/membership
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 4: Neutral login ===')"

if go_test "usecases" "TestPostAuthLogin_NeutralLogin_Success"; then
  test_pass "Neutral login returns JWT with SubjectID, OrganizationID, MembershipID, DeploymentMode"
else
  test_fail "Neutral login"
fi

# ---------------------------------------------------------------------------
# Scenario 5: Legacy login without org/membership
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 5: Legacy login fallback ===')"

if go_test "usecases" "TestPostAuthLogin_LegacyFallback"; then
  test_pass "Legacy DTI login works without org/membership"
else
  test_fail "Legacy login fallback"
fi

# ---------------------------------------------------------------------------
# Scenario 6: Dual claims (both neutral + legacy)
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 6: Dual claims ===')"

if go_test "usecases" "TestPostAuthLogin_DualClaims"; then
  test_pass "Login response includes both neutral claims and legacy DTI fields"
else
  test_fail "Dual claims"
fi

# ---------------------------------------------------------------------------
# Scenario 7: DB errors -> error returned (handler maps to 500)
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 7: DB errors -> 5xx ===')"

if go_test "usecases" "TestPostAuthLogin_DBError"; then
  test_pass "DB/unknown-user error returns error (handler maps to 500)"
else
  test_fail "DB error handling"
fi

# ---------------------------------------------------------------------------
# Scenario 8: Identity denial -> invalid creds 401, inactive 403
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 8: Identity denial -> 4xx ===')"

if go_test "usecases" "TestPostAuthLogin_WrongPassword"; then
  test_pass "Wrong password returns error (handler maps to 401)"
else
  test_fail "Wrong password"
fi

if go_test "usecases" "TestPostAuthLogin_UnknownEmail"; then
  test_pass "Unknown email returns error (handler maps to 401)"
else
  test_fail "Unknown email"
fi

if go_test "usecases" "TestPostAuthLogin_InactiveUser"; then
  test_pass "Inactive user returns error (handler maps to 403)"
else
  test_fail "Inactive user"
fi

# ---------------------------------------------------------------------------
# Scenario 9: JWT roles/permissions ignored in neutral context
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 9: JWT roles/permissions ignored ===')"

if go_test "usecases" "TestPostAuthLogin_NeutralRolesIgnored"; then
  test_pass "Neutral JWT does not filter out legacy fields, but neutral wins for tenant resolution"
else
  test_fail "Neutral roles ignored"
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
