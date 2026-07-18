#!/bin/sh
# Test suite for gateway session proxy (unit 4B3).
# Tests the gateway JWT middleware with neutral, legacy, and dual-mode claims.
# Requires: Go toolchain, no external services.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
GATEWAY="$ROOT/workspace/gateways/api-gateway"

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

# ---------------------------------------------------------------------------
# Scenario 0: Compilation and vet
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 0: Compilation and vet ===')"

cd "$GATEWAY"
if go build ./... 2>&1; then
  test_pass "gateway builds cleanly"
else
  test_fail "gateway build"
fi

if go vet ./... 2>&1; then
  test_pass "go vet passes"
else
  test_fail "go vet"
fi

# ---------------------------------------------------------------------------
# Scenario 1: Route exists — GET /api/users/session/me
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 1: Route registered ===')"

if go test -count=1 -run TestSessionMeRoute_Registered ./... 2>&1; then
  test_pass "GET /api/users/session/me route is registered"
else
  test_fail "session/me route registration"
fi

# ---------------------------------------------------------------------------
# Scenario 2: Header forwarding — neutral claims forwarded as headers
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 2: Header forwarding ===')"

if go test -count=1 -run TestNeutralClaims_ParseAndForwardHeaders ./... 2>&1; then
  test_pass "X-Organization-ID, X-Membership-ID, X-Deployment-Mode forwarded"
else
  test_fail "neutral header forwarding"
fi

# ---------------------------------------------------------------------------
# Scenario 3: Neutral claims parsed
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 3: Neutral claims parsed ===')"

# Same test as scenario 2 — it also verifies neutral claims parsing
if go test -count=1 -run TestNeutralClaims_ParseAndForwardHeaders ./... 2>&1; then
  test_pass "NeutralClaims (sub_id, sid, org_id, mem_id, dep_mode) parsed correctly"
else
  test_fail "neutral claims parsing"
fi

# ---------------------------------------------------------------------------
# Scenario 4: Legacy claims still work (dual mode)
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 4: Legacy claims still work ===')"

if go test -count=1 -run TestLegacyClaims_StillWork ./... 2>&1; then
  test_pass "Legacy DTI claims (user_id, roles) still work"
else
  test_fail "legacy claims"
fi

if go test -count=1 -run TestDualClaims_ForwardBoth ./... 2>&1; then
  test_pass "Dual-mode JWT forwards both neutral + legacy headers"
else
  test_fail "dual claims"
fi

# ---------------------------------------------------------------------------
# Scenario 5: Claims denial — missing/malformed JWT returns 401
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 5: Claims denial ===')"

if go test -count=1 -run TestMissingJWT_Returns401 ./... 2>&1; then
  test_pass "Missing JWT returns 401"
else
  test_fail "missing JWT"
fi

if go test -count=1 -run TestMalformedJWT_Returns401 ./... 2>&1; then
  test_pass "Malformed JWT returns 401"
else
  test_fail "malformed JWT"
fi

if go test -count=1 -run TestValidJWT_NoUsableClaims_Returns401 ./... 2>&1; then
  test_pass "JWT without usable claims returns 401"
else
  test_fail "empty claims JWT"
fi

# ---------------------------------------------------------------------------
# Scenario 6: Public paths bypass auth
# ---------------------------------------------------------------------------
printf '\n%s\n' "$(y '=== Scenario 6: Public paths bypass auth ===')"

if go test -count=1 -run TestPublicPath_BypassesAuth ./... 2>&1; then
  test_pass "Public paths bypass JWT auth"
else
  test_fail "public path bypass"
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
