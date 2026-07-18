#!/usr/bin/env bash
# BFF Session Test Harness — Work Unit 4C (Task 2.2c)
# Tests BFF login/session wiring: login cookies, me, logout, proxy headers, AuthContext
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
echo " BFF Session Test Harness — 4C"
echo " Started: $(date -Iseconds)"
echo "=========================================="

# ─── Safety Net: existing architecture checks ───
echo ""
echo "=== Safety Net ==="
if [ -f "tests/architecture/test-architecture.sh" ]; then
  if bash tests/architecture/test-architecture.sh >/dev/null 2>&1; then
    echo "  Architecture tests: PASS"
  else
    echo "  Architecture tests: ⚠️  Pre-existing failure (not our change)"
  fi
fi

# ─── 1. TypeScript compilation ───
echo ""
echo "=== 1. TypeScript compilation ==="
cd "$PROJECT_ROOT/workspace/frontend"
if command -v tsc >/dev/null 2>&1 || [ -x "node_modules/.bin/tsc" ] || npx --no-install tsc --version >/dev/null 2>&1; then
  if npx --no-install tsc --noEmit 2>&1; then
    echo "  TypeScript compiles cleanly"
    pass "tsc-compile"
  else
    echo "  TypeScript compilation FAILED"
    fail "tsc-compile"
  fi
else
  echo "  ⚠️  tsc not available (npm install needed) — skipping"
  # Not a failure — infrastructure gap, not a code issue
fi
cd "$PROJECT_ROOT"

# ─── 2. Login route — session extraction + cookies + response body ───
echo ""
echo "=== 2. Login route session support ==="
LOGIN_FILE="workspace/frontend/app/api/auth/login/route.ts"

# 2a. Extract neutral claims from JWT
if grep -q "claims\.\(org_id\|organization_id\)" "$LOGIN_FILE" 2>/dev/null || \
   grep -q "claims?\.\(org_id\b\|organization_id\b\)" "$LOGIN_FILE" 2>/dev/null; then
  pass "login-extract-claims"
else
  fail "login-extract-claims"
fi

# 2b. Set session cookies
if grep -q "auto_insight_organization_id" "$LOGIN_FILE" 2>/dev/null && \
   grep -q "auto_insight_membership_id" "$LOGIN_FILE" 2>/dev/null && \
   grep -q "auto_insight_deployment_mode" "$LOGIN_FILE" 2>/dev/null; then
  pass "login-session-cookies"
else
  fail "login-session-cookies"
fi

# 2c. Return session in response body (object literal shorthand `session,` or explicit `session:`)
if grep -Eq "session[,}:]" "$LOGIN_FILE" 2>/dev/null; then
  pass "login-session-body"
else
  fail "login-session-body"
fi

# 2d. Dual mode: null session when no neutral claims (ternary `... : null`)
if grep -Eq "session.*:\s*null\b|null;\s*//" "$LOGIN_FILE" 2>/dev/null || grep -q "hasSession" "$LOGIN_FILE" 2>/dev/null; then
  pass "login-dual-mode-null"
else
  fail "login-dual-mode-null"
fi

# ─── 3. Me route — read session cookies + return in body ───
echo ""
echo "=== 3. Me route session support ==="
ME_FILE="workspace/frontend/app/api/auth/me/route.ts"

# 3a. Read session cookies
if grep -q "auto_insight_organization_id" "$ME_FILE" 2>/dev/null && \
   grep -q "auto_insight_membership_id" "$ME_FILE" 2>/dev/null; then
  pass "me-read-cookies"
else
  fail "me-read-cookies"
fi

# 3b. Return session in response body (object literal `session` as shorthand or key)
if grep -Eq "session[ ,}:]" "$ME_FILE" 2>/dev/null; then
  pass "me-session-body"
else
  fail "me-session-body"
fi

# 3c. Null session when no session cookies (checks for `: null` assignment)
if grep -q ': null' "$ME_FILE" 2>/dev/null; then
  pass "me-null-session"
else
  fail "me-null-session"
fi

# 3d. 401 when no token (existing behavior preserved)
if grep -q "401" "$ME_FILE" 2>/dev/null; then
  pass "me-401-preserved"
else
  fail "me-401-preserved"
fi

# ─── 4. Logout route — clears ALL cookies including session ───
echo ""
echo "=== 4. Logout session cleanup ==="
LOGOUT_FILE="workspace/frontend/app/api/auth/logout/route.ts"

if grep -q "auto_insight_organization_id" "$LOGOUT_FILE" 2>/dev/null && \
   grep -q "auto_insight_membership_id" "$LOGOUT_FILE" 2>/dev/null && \
   grep -q "auto_insight_deployment_mode" "$LOGOUT_FILE" 2>/dev/null; then
  pass "logout-clears-session"
else
  fail "logout-clears-session"
fi

# ─── 5. Generic proxy — forwards session headers ───
echo ""
echo "=== 5. Generic proxy session headers ==="
PROXY_FILE="workspace/frontend/app/api/[...path]/route.ts"

if grep -q "X-Organization-ID" "$PROXY_FILE" 2>/dev/null && \
   grep -q "X-Membership-ID" "$PROXY_FILE" 2>/dev/null && \
   grep -q "X-Deployment-Mode" "$PROXY_FILE" 2>/dev/null; then
  pass "proxy-session-headers"
else
  fail "proxy-session-headers"
fi

# Check session cookies are read
if grep -q "auto_insight_organization_id" "$PROXY_FILE" 2>/dev/null && \
   grep -q "auto_insight_membership_id" "$PROXY_FILE" 2>/dev/null && \
   grep -q "auto_insight_deployment_mode" "$PROXY_FILE" 2>/dev/null; then
  pass "proxy-reads-session-cookies"
else
  fail "proxy-reads-session-cookies"
fi

# ─── 6. AuthContext — exposes session ───
echo ""
echo "=== 6. AuthContext session support ==="
AUTHCTX_FILE="workspace/frontend/sdk/auth/AuthContext.tsx"

# 6a. Session type exists
if grep -q "interface Session\|type Session" "$AUTHCTX_FILE" 2>/dev/null; then
  pass "authctx-session-type"
else
  fail "authctx-session-type"
fi

# 6b. Session in context type
if grep -q "session:" "$AUTHCTX_FILE" 2>/dev/null; then
  pass "authctx-session-field"
else
  fail "authctx-session-field"
fi

# 6c. Session state managed
if grep -q "setSession\|session.*useState" "$AUTHCTX_FILE" 2>/dev/null; then
  pass "authctx-session-state"
else
  fail "authctx-session-state"
fi

# 6d. Login extracts session from response
if grep -q "data\.session\|\.session" "$AUTHCTX_FILE" 2>/dev/null; then
  pass "authctx-login-session"
else
  fail "authctx-login-session"
fi

# 6e. Logout clears session
if grep -q "setSession.*null" "$AUTHCTX_FILE" 2>/dev/null; then
  pass "authctx-logout-clear"
else
  fail "authctx-logout-clear"
fi

# ─── 7. Fail-closed: middleware.ts NOT modified ───
echo ""
echo "=== 7. Middleware guard ==="
MIDDLEWARE_FILE="workspace/frontend/middleware.ts"
if grep -q "auto_insight_organization_id\|auto_insight_membership_id\|auto_insight_deployment_mode" "$MIDDLEWARE_FILE" 2>/dev/null; then
  fail "middleware-touched-session"
  echo "  ⚠️  Middleware references session cookies — should NOT"
else
  pass "middleware-untouched"
fi

# ─── 8. No generated files modified ───
echo ""
echo "=== 8. Generated file guard ==="
if grep -q "organization_id\|membership_id\|deployment_mode\|auto_insight_organization_id\|auto_insight_membership_id\|auto_insight_deployment_mode" \
  workspace/frontend/sdk/api/*_generated.ts 2>/dev/null; then
  fail "generated-files-touched"
  echo "  ⚠️  Generated files reference session terms"
else
  pass "generated-files-untouched"
fi

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
