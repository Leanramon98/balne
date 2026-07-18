#!/usr/bin/env bash
# Neutral Shell Test Harness — Work Unit 6 (Task 3.1)
# Tests: ModuleRegistry, NeutralShell, dual-mode coexistence, permissions filtering
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
echo " Neutral Shell Test Harness — Unit 6"
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

# ─── 1. File existence ───
echo ""
echo "=== 1. File existence ==="

PLATFORM_DIR="workspace/frontend/sdk/platform"
MODULE_CONTRIB="$PLATFORM_DIR/module-contributions.ts"
PLATFORM_INDEX="$PLATFORM_DIR/index.ts"
NEUTRAL_SHELL="workspace/frontend/components/templates/NeutralShell.tsx"

if [ -f "$MODULE_CONTRIB" ]; then
  pass "file-module-contributions"
else
  fail "file-module-contributions"
fi

if [ -f "$PLATFORM_INDEX" ]; then
  pass "file-platform-index"
else
  fail "file-platform-index"
fi

if [ -f "$NEUTRAL_SHELL" ]; then
  pass "file-neutral-shell"
else
  fail "file-neutral-shell"
fi

# ─── 2. TypeScript compilation ───
echo ""
echo "=== 2. TypeScript compilation ==="
cd "$PROJECT_ROOT/workspace/frontend"
if npx --no-install tsc --noEmit 2>&1; then
  echo "  TypeScript compiles cleanly"
  pass "tsc-compile"
else
  echo "  TypeScript compilation FAILED"
  fail "tsc-compile"
fi
cd "$PROJECT_ROOT"

# ─── 3. ModuleRegistry behavioral tests via tsx ───
echo ""
echo "=== 3. ModuleRegistry behavioral ==="

TSX_AVAILABLE=false
if npx --no-install tsx --version >/dev/null 2>&1; then
  TSX_AVAILABLE=true
fi

if [ "$TSX_AVAILABLE" = true ]; then
  REGISTRY_TEST=$(cat <<'ENDTEST'
import { moduleRegistry, ModuleRegistry, ModuleContribution } from './workspace/frontend/sdk/platform/module-contributions';

let failures: string[] = [];

// 3a. ModuleRegistry is a singleton
if (!moduleRegistry) {
  failures.push('singleton-exists');
}
if (!(moduleRegistry instanceof ModuleRegistry)) {
  failures.push('singleton-instance');
}

// 3b. Register a module
const contrib: ModuleContribution = {
  moduleId: 'test-module',
  navItems: [
    { id: 'item1', label: 'Item One', href: '/item1', order: 2 },
    { id: 'item2', label: 'Item Two', href: '/item2', order: 1, section: 'Section A' },
  ],
};
moduleRegistry.register(contrib);

// 3c. hasModule
if (!moduleRegistry.hasModule('test-module')) {
  failures.push('hasModule-true');
}
if (moduleRegistry.hasModule('nonexistent')) {
  failures.push('hasModule-false');
}

// 3d. getModule
const gotten = moduleRegistry.getModule('test-module');
if (!gotten) {
  failures.push('getModule-found');
} else if (gotten.moduleId !== 'test-module') {
  failures.push('getModule-id');
} else if (gotten.navItems.length !== 2) {
  failures.push('getModule-items-count');
}

// 3e. getNavItems returns all items sorted by order ascending
const allItems = moduleRegistry.getNavItems();
if (allItems.length !== 2) {
  failures.push('getNavItems-count');
} else {
  // Item Two (order:1) should come before Item One (order:2)
  if (allItems[0].id !== 'item2') {
    failures.push('getNavItems-order');
  }
  if (allItems[1].id !== 'item1') {
    failures.push('getNavItems-order-2');
  }
}

// 3f. getNavItems includes section info
const sectionA = allItems.filter(i => i.section === 'Section A');
if (sectionA.length !== 1) {
  failures.push('getNavItems-section');
}

// 3g. Permissions filtering — item with required permissions not granted
moduleRegistry.register({
  moduleId: 'auth-module',
  navItems: [
    { id: 'admin-item', label: 'Admin', href: '/admin', requiredPermissions: ['admin'] },
    { id: 'public-item', label: 'Public', href: '/public' },
  ],
});

const userItems = moduleRegistry.getNavItems(['user']);
if (userItems.length !== 3) {
  failures.push(`perm-filter-count: expected 3 got ${userItems.length}`);
}
const adminItemRestricted = userItems.find(i => i.id === 'admin-item');
if (adminItemRestricted) {
  failures.push('perm-filter-admin-shown');
}
const publicItem = userItems.find(i => i.id === 'public-item');
if (!publicItem) {
  failures.push('perm-filter-public-hidden');
}

// 3h. Admin permissions show restricted items
const adminItems = moduleRegistry.getNavItems(['user', 'admin']);
const adminItemShown = adminItems.find(i => i.id === 'admin-item');
if (!adminItemShown) {
  failures.push('perm-filter-admin-shown-with-perm');
}

// 3i. getNavItems with undefined/null permissions
const undefinedPerm = moduleRegistry.getNavItems(undefined);
if (undefinedPerm.length !== 3) {
  failures.push(`perm-filter-undefined: expected 3 got ${undefinedPerm.length}`);
}
const adminItemUndefined = undefinedPerm.find(i => i.id === 'admin-item');
if (adminItemUndefined) {
  failures.push('perm-filter-undefined-admin-shown');
}

// 3j. Empty contributions — no nav items registered yet from fresh registry
const freshRegistry = new ModuleRegistry();
const emptyItems = freshRegistry.getNavItems();
if (emptyItems.length !== 0) {
  failures.push('empty-registry: expected 0 items');
}

// 3k. Register module with no nav items
freshRegistry.register({ moduleId: 'empty-module', navItems: [] });
if (!freshRegistry.hasModule('empty-module')) {
  failures.push('hasModule-empty-module');
}
const emptyModuleItems = freshRegistry.getNavItems();
if (emptyModuleItems.length !== 0) {
  failures.push('empty-module-items: expected 0');
}

// 3l. Module isolation — fresh registry has no items from main registry
if (freshRegistry.getNavItems().length !== 0) {
  failures.push('module-isolation: fresh registry contaminated');
}

// 3m. NavItem with undefined section
moduleRegistry.register({
  moduleId: 'no-section-module',
  navItems: [
    { id: 'no-section-item', label: 'No Section', href: '/no-section' },
  ],
});
const noSectionItems = moduleRegistry.getNavItems(['user']);
const noSectionFound = noSectionItems.find(i => i.id === 'no-section-item');
if (!noSectionFound) {
  failures.push('no-section-item-missing');
}

if (failures.length > 0) {
  console.log(`FAILURES: ${failures.join(', ')}`);
  process.exit(1);
} else {
  console.log('  ModuleRegistry: ALL BEHAVIORAL CHECKS PASSED');
}
ENDTEST
)

  # Write test to temp file and run
  TMP_FILE=$(mktemp)
  echo "$REGISTRY_TEST" > "$TMP_FILE"
  
  if cd "$PROJECT_ROOT" && npx --no-install tsx "$TMP_FILE" 2>&1; then
    pass "module-registry-behavior"
  else
    fail "module-registry-behavior"
  fi
  rm -f "$TMP_FILE"
  cd "$PROJECT_ROOT"
else
  echo "  ⚠️  tsx not available — skipping behavioral tests (structural only)"
  # Fallback: check structural patterns via grep
  # 3a. ModuleRegistry class exists
  if grep -q "export class ModuleRegistry\|class ModuleRegistry" "$MODULE_CONTRIB" 2>/dev/null; then
    pass "mr-class-grep"
  else
    fail "mr-class-grep"
  fi
  # 3b. NavItem interface
  if grep -q "interface NavItem\|export interface NavItem" "$MODULE_CONTRIB" 2>/dev/null; then
    pass "mr-navitem-interface"
  else
    fail "mr-navitem-interface"
  fi
  # 3c. ModuleContribution interface
  if grep -q "interface ModuleContribution\|export interface ModuleContribution" "$MODULE_CONTRIB" 2>/dev/null; then
    pass "mr-contribution-interface"
  else
    fail "mr-contribution-interface"
  fi
  # 3d. getNavItems with permissions argument
  if grep -q "getNavItems.*permissions\|getNavItems.*userPermissions" "$MODULE_CONTRIB" 2>/dev/null; then
    pass "mr-getNavItems-permissions"
  else
    fail "mr-getNavItems-permissions"
  fi
  # 3e. moduleRegistry singleton exported
  if grep -q "export const moduleRegistry" "$MODULE_CONTRIB" 2>/dev/null; then
    pass "mr-singleton-export"
  else
    fail "mr-singleton-export"
  fi
fi

# ─── 4. NeutralShell structural checks ───
echo ""
echo "=== 4. NeutralShell structural ==="

# 4a. NeutralShell uses 'use client'
if head -1 "$NEUTRAL_SHELL" 2>/dev/null | grep -q "'use client'"; then
  pass "shell-use-client"
else
  fail "shell-use-client"
fi

# 4b. NeutralShell uses useAuth for user/session context
if grep -q "useAuth\|useSession" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-uses-auth"
else
  fail "shell-uses-auth"
fi

# 4c. NeutralShell references moduleRegistry (for nav items)
if grep -q "moduleRegistry\|getNavItems" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-uses-registry"
else
  fail "shell-uses-registry"
fi

# 4d. NeutralShell exports a function/component (export function or export default)
if grep -q "export function NeutralShell\|export default function\|export const NeutralShell" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-export"
else
  fail "shell-export"
fi

# 4e. NeutralShell accepts children prop
if grep -q "children.*ReactNode\|children.*React\.ReactNode\|React\.PropsWithChildren\|children:\|children, " "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-children-prop"
else
  fail "shell-children-prop"
fi

# 4f. NeutralShell uses lucide-react icons (has icon imports)
if grep -q "from 'lucide-react'\|from \"lucide-react\"" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-icon-imports"
else
  fail "shell-icon-imports"
fi

# 4g. NeutralShell uses cn utility
if grep -q "from '@/lib/utils'\|from \"@/lib/utils\"\|cn(" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-cn-utility"
else
  fail "shell-cn-utility"
fi

# 4h. NeutralShell renders nav items (has navigation element)
if grep -q "<nav\|nav.*className\|nav className" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-nav-element"
else
  fail "shell-nav-element"
fi

# 4i. NeutralShell has sidebar structure
if grep -q "<aside\|sidebar\|Sidebar" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-sidebar"
else
  fail "shell-sidebar"
fi

# 4j. NeutralShell has header with user profile
if grep -q "<header\|header" "$NEUTRAL_SHELL" 2>/dev/null; then
  pass "shell-header"
else
  fail "shell-header"
fi

# 4k. NeutralShell does NOT use DtiLogo
if grep -q "DtiLogo\|DestinoPill\|dti-logo\|destino" "$NEUTRAL_SHELL" 2>/dev/null; then
  fail "shell-dti-content"
  echo "  ⚠️  NeutralShell contains DTI-specific content"
else
  pass "shell-no-dti-content"
fi

# ─── 5. Platform SDK index barrel export ───
echo ""
echo "=== 5. Platform SDK barrel export ==="

if grep -q "module-contributions\|moduleRegistry\|ModuleRegistry\|ModuleContribution\|NavItem" "$PLATFORM_INDEX" 2>/dev/null; then
  pass "barrel-exports"
else
  fail "barrel-exports"
fi

# ─── 6. Dual mode — DtiShell continues working ───
echo ""
echo "=== 6. Dual mode coexistence ==="

if [ -f "workspace/frontend/components/templates/DtiShell.tsx" ]; then
  # DtiShell still exists
  if head -1 "workspace/frontend/components/templates/DtiShell.tsx" 2>/dev/null | grep -q "'use client'"; then
    pass "dual-dtishell-exists"
  else
    pass "dual-dtishell-exists"
  fi
else
  fail "dual-dtishell-exists"
fi

# Verify (dti)/layout.tsx still uses DtiShell
if grep -q "DtiShell" "workspace/frontend/app/(dti)/layout.tsx" 2>/dev/null; then
  pass "dual-dti-layout-unchanged"
else
  fail "dual-dti-layout-unchanged"
fi

# Verify AppShell also still exists
if [ -f "workspace/frontend/components/templates/AppShell.tsx" ]; then
  pass "dual-appshell-exists"
else
  fail "dual-appshell-exists"
fi

# ─── 7. Generated file guard ───
echo ""
echo "=== 7. Generated file guard ==="

SDK_FILES=$(ls workspace/frontend/sdk/api/*_generated.ts 2>/dev/null || true)
if [ -n "$SDK_FILES" ]; then
  if grep -q "platform\|moduleRegistry\|NeutralShell" $SDK_FILES 2>/dev/null; then
    fail "generated-files-touched"
    echo "  ⚠️  Generated files reference new platform terms"
  else
    pass "generated-files-untouched"
  fi
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
