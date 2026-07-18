#!/usr/bin/env bash
# Reference Module Test Harness — Work Unit 7 (Task 3.2)
# Tests: Module registration, routes, permissions, health endpoint, tenant-scoped CRUD,
#        module isolation, clean removal, navigation contribution, no excluded concepts.
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
echo " Reference Module Test Harness — Unit 7"
echo " Started: $(date -Iseconds)"
echo "=========================================="

# ─── 1. File existence ───
echo ""
echo "=== 1. File existence ==="

BACKEND_DIR="workspace/backend/internal/modules/reference"
FRONTEND_DIR="workspace/frontend/app/(modules)/reference"

BACKEND_FILES=(
  "$BACKEND_DIR/module.go"
  "$BACKEND_DIR/handler.go"
  "$BACKEND_DIR/handler_test.go"
)
FRONTEND_FILES=(
  "$FRONTEND_DIR/page.tsx"
  "$FRONTEND_DIR/layout.tsx"
)
SCRIPT_FILE="scripts/test-reference-module.sh"

for f in "${BACKEND_FILES[@]}" "${FRONTEND_FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "file-exists: $f"
  else
    fail "file-exists: $f"
  fi
done

if [ -f "$SCRIPT_FILE" ]; then
  pass "file-exists: $SCRIPT_FILE"
else
  fail "file-exists: $SCRIPT_FILE"
fi

# ─── 2. Go module compilation and tests ───
echo ""
echo "=== 2. Go module compilation and tests ==="

cd "$PROJECT_ROOT/workspace/backend"
if go build ./internal/modules/reference/... 2>&1; then
  pass "go-build-reference"
else
  fail "go-build-reference"
fi

if go vet ./internal/modules/reference/... 2>&1; then
  pass "go-vet-reference"
else
  fail "go-vet-reference"
fi

if go test -count=1 ./internal/modules/reference/... 2>&1; then
  pass "go-test-reference"
else
  fail "go-test-reference"
fi
cd "$PROJECT_ROOT"

# ─── 3. Module descriptor structure (via go vet structural check) ───
echo ""
echo "=== 3. Module descriptor structure ==="

# Verify the module registers with NewRegistry correctly via compilation
# (already covered by go build + go test above)

# Check module.go has the right interface implementation
MODULE_GO="$PROJECT_ROOT/$BACKEND_DIR/module.go"
if grep -q "func (m \*ReferenceModule) Descriptor()" "$MODULE_GO" 2>/dev/null; then
  pass "module-Descriptor-method"
else
  fail "module-Descriptor-method"
fi

if grep -q "reference.read\|reference.write\|reference.admin" "$MODULE_GO" 2>/dev/null; then
  pass "module-permissions"
else
  fail "module-permissions"
fi

if grep -q "reference-001" "$MODULE_GO" 2>/dev/null; then
  pass "module-migration-id"
else
  fail "module-migration-id"
fi

if grep -q "reference.ok" "$MODULE_GO" 2>/dev/null; then
  pass "module-health"
else
  fail "module-health"
fi

if grep -q "postgres" "$MODULE_GO" 2>/dev/null; then
  pass "module-capability-postgres"
else
  fail "module-capability-postgres"
fi

# ─── 4. Handler structure ───
echo ""
echo "=== 4. Handler structure ==="

HANDLER_GO="$PROJECT_ROOT/$BACKEND_DIR/handler.go"

for handler in "HandleHealth" "HandleListNotes" "HandleCreateNote" "HandleGetNote" "HandleUpdateNote" "HandleDeleteNote"; do
  if grep -q "func $handler(" "$HANDLER_GO" 2>/dev/null; then
    pass "handler-exists: $handler"
  else
    fail "handler-exists: $handler"
  fi
done

# Verify tenant isolation pattern
if grep -q "X-Organization-ID\|OrganizationID" "$HANDLER_GO" 2>/dev/null; then
  pass "handler-tenant-isolation"
else
  fail "handler-tenant-isolation"
fi

# Verify in-memory store pattern
if grep -q "map\[string\]\*Note\|NoteStore" "$HANDLER_GO" 2>/dev/null; then
  pass "handler-in-memory-store"
else
  fail "handler-in-memory-store"
fi

# ─── 5. No excluded concepts ───
echo ""
echo "=== 5. No excluded concepts ==="

REFERENCE_FILES=$(find "$PROJECT_ROOT/$BACKEND_DIR" -name "*.go" -type f ! -name "*_test.go" 2>/dev/null || true)
# Check for DTI-specific domain terms that would indicate the module is doing DTI work.
# Generic English words (client, case) and standard Go/stdlib terms (document) are excluded
# because they appear in standard Go patterns (http.Client, switch case) and are not DTI-specific.
DTI_TERMS="TipTap DOCX PDF destino evaluacion ambito indicador"

for term in $DTI_TERMS; do
  CONTAMINATED=""
  for f in $REFERENCE_FILES; do
    if grep -qi "$term" "$f" 2>/dev/null; then
      CONTAMINATED="$CONTAMINATED $f"
    fi
  done
  if [ -z "$CONTAMINATED" ]; then
    pass "no-dti-term: $term"
  else
    fail "no-dti-term: $term found in$CONTAMINATED"
  fi
done

# ─── 6. Frontend structure ───
echo ""
echo "=== 6. Frontend structure ==="

LAYOUT_TSX="$PROJECT_ROOT/$FRONTEND_DIR/layout.tsx"
PAGE_TSX="$PROJECT_ROOT/$FRONTEND_DIR/page.tsx"

# Layout checks
if [ -f "$LAYOUT_TSX" ]; then
  if head -1 "$LAYOUT_TSX" 2>/dev/null | grep -q "'use client'"; then
    pass "layout-use-client"
  else
    fail "layout-use-client"
  fi

  if grep -q "moduleRegistry.register\|moduleRegistry" "$LAYOUT_TSX" 2>/dev/null; then
    pass "layout-registers-with-registry"
  else
    fail "layout-registers-with-registry"
  fi

  if grep -q "ReferenceLayout\|export default function" "$LAYOUT_TSX" 2>/dev/null; then
    pass "layout-exports-default"
  else
    fail "layout-exports-default"
  fi
fi

# Page checks
if [ -f "$PAGE_TSX" ]; then
  if head -1 "$PAGE_TSX" 2>/dev/null | grep -q "'use client'"; then
    pass "page-use-client"
  else
    fail "page-use-client"
  fi

  if grep -q "export default function\|export default " "$PAGE_TSX" 2>/dev/null; then
    pass "page-exports-default"
  else
    fail "page-exports-default"
  fi

  if grep -q "fetch\|useEffect\|useState" "$PAGE_TSX" 2>/dev/null; then
    pass "page-data-fetching"
  else
    fail "page-data-fetching"
  fi
fi

# ─── 7. Module isolation — reference doesn't import other modules ───
echo ""
echo "=== 7. Module isolation ==="

REFERENCE_GO_FILES=$(find "$PROJECT_ROOT/$BACKEND_DIR" -name "*.go" -type f 2>/dev/null || true)
# Verify reference module only imports its own package + standard library + uuid + platform module
for f in $REFERENCE_GO_FILES; do
  if grep -E "\"project-base/backend/internal/(modules/(?!reference))" "$f" 2>/dev/null; then
    fail "module-imports-peer: $f"
  else
    pass "module-no-peer-imports: $(basename $f)"
  fi
done

# ─── 8. Frontend doesn't import DTI terms ───
echo ""
echo "=== 8. Frontend no DTI content ==="

REFERENCE_FRONTEND_FILES=$(find "$PROJECT_ROOT/$FRONTEND_DIR" -name "*.tsx" -o -name "*.ts" 2>/dev/null || true)
FRONTEND_VIOLATIONS=0
for f in $REFERENCE_FRONTEND_FILES; do
  FILE_CONTENT=$(cat "$f" 2>/dev/null || true)
  for term in $DTI_TERMS; do
    if echo "$FILE_CONTENT" | grep -qi "$term" 2>/dev/null; then
      fail "frontend-dti-term: $term in $(basename $f)"
      FRONTEND_VIOLATIONS=$((FRONTEND_VIOLATIONS+1))
    fi
  done
done
if [ "$FRONTEND_VIOLATIONS" -eq 0 ]; then
  pass "frontend-no-dti-terms"
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
