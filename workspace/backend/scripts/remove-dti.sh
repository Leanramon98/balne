#!/usr/bin/env bash
# remove-dti.sh — DTI Removal Plan (Simulation Mode)
# 
# WORK UNIT 11 (Task 4.3) — Remove DTI After Acceptance
#
# SIMULATION MODE: This script is a DOCUMENTED REMOVAL PLAN.
# It does NOT delete any files. Instead, it prints every path to remove,
# in dependency order, with verification commands for each step.
#
# Run with: bash remove-dti.sh
# This will print the plan. No files are deleted.
#
# To execute the removal for real, pipe the output through a manual review
# process. Each step MUST pass its verification before proceeding.
#
# Cross-reference: preservation/dti/preservation.json (crafted in unit 1.1)
# contains 32 artifact entries (generator-source, generator-output,
# migration-tree, active-change-tree) and 13 dirty boundary entries.
# Each removed path below is recoverable from the preserved commit/tree:
#   commit: 61d1204432f23292c5236261da98b647fbb14be9
#   tree:   8954d088db60ee23283e7e6cadf9256ffcf0473b
#
# Dependencies:
# - Unit 2.2b2 — Users service neutralized (DO NOT remove, keep as neutral core)
# - Unit 2.2b3 — Gateway neutralized (DO NOT remove, keep as optional adapter)
# - Unit 2.2c  — BFF/Session wiring neutralized (DO NOT remove, keep as neutral)
# - Unit 3.1  — NeutralShell created; modules route exists
# - Unit 3.2  — Reference module created (neutral replacement)
# - Unit 4.2  — Compat adapters created (DTI-to-neutral mapping)
#
# Protected paths (NEVER remove):
# - docs/product/** (per project guard)
# - preservation/dti/ (DTI recovery evidence)
# - *generated* (regenerated via core-cli, not hand-edited)
#
# Related unit test harnesses:
# - scripts/test-neutral-release.sh (this work unit)
# - scripts/verify-preservation.sh (DTI recovery, unit 1.1)
# - scripts/test-compatibility.sh (compat adapters, unit 4.2)
# - scripts/test-neutral-shell.sh (neutral shell, unit 3.1)
# - scripts/test-reference-module.sh (reference module, unit 3.2)
set -euo pipefail

MODE="${1:-simulate}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

echo "=============================================="
echo " DTI Removal Plan — Work Unit 11"
echo " Mode: $MODE (simulation = print only)"
echo " Started: $(date -Iseconds)"
echo "=============================================="
echo ""
echo "Preservation reference:"
echo "  Commit: 61d1204432f23292c5236261da98b647fbb14be9"
echo "  Tree:   8954d088db60ee23283e7e6cadf9256ffcf0473b"
echo "  Artifacts:  32 (from preservation/dti/preservation.json)"
echo "  Dirty:      13 protected entries"
echo ""

# ─── Phase 0: Pre-flight Checks ───
echo "## Phase 0: Pre-flight Checks"
echo ""

echo "### 0.1 Verify preservation evidence is intact"
echo '```bash'
echo "python3 -c \"import json; d=json.load(open('$PROJECT_ROOT/preservation/dti/preservation.json')); print(f'OK: schema={d[\"schema_version\"]}, artifacts={len(d[\"artifacts\"])}, dirty={len(d[\"preserved_dirty\"])}')\""
echo '```'

echo "### 0.2 Verify neutral shell exists"
echo '```bash'
echo "test -f $PROJECT_ROOT/workspace/frontend/components/templates/NeutralShell.tsx && echo 'OK: NeutralShell exists'"
echo '```'

echo "### 0.3 Verify compat adapters exist"
echo '```bash'
echo "test -d $PROJECT_ROOT/workspace/backend/internal/platform/compat && echo 'OK: compat directory exists'"
echo '```'

echo "### 0.4 Verify reference module exists (neutral replacement)"
echo '```bash'
echo "test -d $PROJECT_ROOT/workspace/backend/internal/modules/reference && echo 'OK: reference module exists'"
echo '```'

echo "### 0.5 Verify neutral build compiles"
echo '```bash'
echo "cd $PROJECT_ROOT/workspace/backend && go build ./... && echo 'OK: backend builds cleanly'"
echo '```'
echo ""

# ─── Phase 1: Remove DTI Frontend Routes and Components ───
echo "## Phase 1: Remove DTI Frontend Routes and Components"
echo ""

echo "### 1.1 Remove DTI route group"
echo "Path: workspace/frontend/app/(dti)/"
echo "Files:"
echo "  - workspace/frontend/app/(dti)/layout.tsx"
echo "  - workspace/frontend/app/(dti)/destinos/page.tsx"
echo "  - workspace/frontend/app/(dti)/evaluaciones/page.tsx"
echo "  - workspace/frontend/app/(dti)/plan-transformacion/page.tsx"
echo "  - workspace/frontend/app/(dti)/buenas-practicas/page.tsx"
echo "  - workspace/frontend/app/(dti)/reportes/page.tsx"
echo "  - workspace/frontend/app/(dti)/configuracion/page.tsx"
echo ""
echo "Preservation: workspace/frontend/app/(dti)/* — active-change-tree (covered by commit tree)"
echo ""
echo "Verification:"
echo '```bash'
echo "test ! -d $PROJECT_ROOT/workspace/frontend/app/(dti) && echo 'OK: DTI routes removed'"
echo '```'
echo ""

echo "### 1.2 Remove DTI shell component"
echo "Path: workspace/frontend/components/templates/DtiShell.tsx"
echo ""
echo "Preservation: DtiShell.tsx — active DTI component (recoverable from commit)"
echo ""
echo "Verification:"
echo '```bash'
echo "test ! -f $PROJECT_ROOT/workspace/frontend/components/templates/DtiShell.tsx && echo 'OK: DtiShell removed'"
echo '```'
echo ""

echo "### 1.3 Remove DTI-specific UI components"
echo "Paths:"
echo "  - workspace/frontend/components/dti/  (if exists)"
echo "  - workspace/frontend/components/destino/  (if exists)"
echo ""
echo "Preservation: These components are part of active DTI product structure."
echo ""
echo "Verification:"
echo '```bash'
echo "test ! -d $PROJECT_ROOT/workspace/frontend/components/dti && echo 'OK: DTI components removed'"
echo "test ! -d $PROJECT_ROOT/workspace/frontend/components/destino && echo 'OK: Destino components removed'"
echo '```'
echo ""

echo "### 1.4 Remove DTI-specific icons and assets"
echo "Paths:"
echo "  - workspace/frontend/public/dti-logo.svg  (if exists)"
echo "  - workspace/frontend/public/destinos/  (if exists)"
echo ""
echo "Verification:"
echo '```bash'
echo "test ! -f $PROJECT_ROOT/workspace/frontend/public/dti-logo.svg 2>/dev/null && echo 'OK: DTI logo removed'"
echo '```'
echo ""

# ─── Phase 2: Remove DTI Backend Services ───
echo "## Phase 2: Remove DTI Backend Services"
echo ""

echo "### 2.1 Remove evaluations-service (DTI product service)"
echo "Path: workspace/services/evaluations-service/"
echo "Files:"
echo "  - workspace/services/evaluations-service/cmd/server/main.go"
echo "  - workspace/services/evaluations-service/cmd/server/main_generated.go"
echo "  - workspace/services/evaluations-service/internal/ (all sub-packages)"
echo "  - workspace/services/evaluations-service/migrations/ (all migration files)"
echo "  - workspace/services/evaluations-service/init_generated.sql"
echo "  - workspace/services/evaluations-service/schema.yaml"
echo "  - workspace/services/evaluations-service/go.mod"
echo "  - workspace/services/evaluations-service/go.sum"
echo ""
echo "Preservation: evaluations-service artifacts in preservation manifest:"
echo "  - workspace/services/evaluations-service/schema.yaml → generator-source"
echo "  - workspace/services/evaluations-service/init_generated.sql → generator-output"
echo "  - workspace/services/evaluations-service/cmd/server/main_generated.go → generator-output"
echo "  - workspace/services/evaluations-service/internal/grpc/grpc_server_generated.go → generator-output"
echo "  - workspace/services/evaluations-service/migrations → migration-tree"
echo ""
echo "Recovery: git checkout 61d1204432f23292c5236261da98b647fbb14be9 -- workspace/services/evaluations-service/"
echo ""
echo "Verification:"
echo '```bash'
echo "test ! -d $PROJECT_ROOT/workspace/services/evaluations-service && echo 'OK: evaluations-service removed'"
echo '```'
echo ""

echo "### 2.2 Remove DTI references from api-gateway"
echo "Path: workspace/gateways/api-gateway/"
echo "Actions:"
echo "  - Remove evaluaciones routes from routes_users.go (DTI references)"
echo "  - Keep neutral session logic (added in 2.2b3)"
echo ""
echo "Note: users-service and api-gateway remain as optional infrastructure,"
echo "but DTI-specific route handlers are removed."
echo ""
echo "Verification:"
echo '```bash'
echo "grep -rl 'evaluaciones\|destino' $PROJECT_ROOT/workspace/gateways/api-gateway/ 2>/dev/null && echo 'WARN: DTI refs remain' || echo 'OK: no DTI refs in gateway'"
echo '```'
echo ""

# ─── Phase 3: Remove DTI Shared Contracts ───
echo "## Phase 3: Remove DTI Shared Contracts"
echo ""

echo "### 3.1 Remove evaluations-service proto contracts"
echo "Path: workspace/shared-contracts/proto/evaluations-service/"
echo ""
echo "Preservation: workspace/shared-contracts/proto/evaluations-service/evaluations-service_generated.proto → generator-output"
echo ""
echo "Verification:"
echo '```bash'
echo "test ! -f $PROJECT_ROOT/workspace/shared-contracts/proto/evaluations-service/evaluations-service_generated.proto 2>/dev/null && echo 'OK: evaluation proto removed'"
echo '```'
echo ""

echo "### 3.2 Strip DTI references from shared TypeScript contracts"
echo "Path: workspace/shared-contracts/ts/"
echo "Actions:"
echo "  - Remove eval-related endpoint types from endpoints_generated.ts (generated — wait for core-cli)"
echo "  - Remove DTI RBAC roles/types from rbac_generated.ts (generated — wait for core-cli)"
echo ""
echo "⚠️  GENERATED FILES — do NOT edit by hand. Remove source upstream and"
echo "regenerate with 'core-cli sync' when the generator becomes available."
echo ""
echo "Verification:"
echo '```bash'
echo "grep -rl 'evaluaciones\|destino' $PROJECT_ROOT/workspace/shared-contracts/ts/*_generated.ts 2>/dev/null && echo 'WARN: DTI refs in generated contracts — wait for core-cli' || echo 'OK: no DTI refs in contracts'"
echo '```'
echo ""

# ─── Phase 4: Remove DTI Infrastructure ───
echo "## Phase 4: Remove DTI Infrastructure"
echo ""

echo "### 4.1 Remove evaluations-service from Docker Compose"
echo "Path: workspace/infra/docker-compose.yml"
echo "Actions:"
echo "  - Remove evaluations-service service block"
echo "  - Remove evaluations-service network references"
echo ""
echo "⚠️  GENERATED FILE — do NOT edit by hand. Update generator source"
echo "and regenerate with 'core-cli sync'."
echo ""
echo "Verification:"
echo '```bash'
echo "grep -c 'evaluations-service' $PROJECT_ROOT/workspace/infra/docker-compose.yml 2>/dev/null || echo 'OK: no evaluations references in compose'"
echo '```'
echo ""

echo "### 4.2 Remove evaluations init SQL"
echo "Path: workspace/infra/init_generated.sql"
echo "Actions:"
echo "  - Remove evaluations schema creation and seed data"
echo ""
echo "⚠️  GENERATED FILE — do NOT edit by hand. Update generator source"
echo "and regenerate with 'core-cli sync'."
echo ""
echo "Preservation: workspace/infra/init_generated.sql → generator-output"
echo ""
echo "Verification:"
echo '```bash'
echo "grep -c 'evaluaciones\|evaluations' $PROJECT_ROOT/workspace/infra/init_generated.sql 2>/dev/null || echo 'OK: no evaluations in init SQL'"
echo '```'
echo ""

# ─── Phase 5: Update Deployment Composition (if DTI profiles exist) ───
echo "## Phase 5: Update Deployment Composition"
echo ""

echo "### 5.1 Remove DTI product module from manifests"
echo "Path: workspace/infra/manifests/ (if DTI profile exists)"
echo "Actions:"
echo "  - Remove 'evaluations' from enabled module lists"
echo "  - Verify remaining modules are only: identity, organizations, authorization,"
echo "    audit, configuration, entitlements, reference"
echo ""
echo "Verification:"
echo '```bash'
echo "FOUND=\$(grep -rl 'evaluations\|evaluaciones' $PROJECT_ROOT/workspace/infra/manifests/ 2>/dev/null || echo ''); if [ -z \"\$FOUND\" ]; then echo 'OK: no DTI modules in manifests'; else echo 'WARN: DTI modules remain'; fi"
echo '```'
echo ""

# ─── Phase 6: Clean Up DTI References in Neutral Code ───
echo "## Phase 6: Clean Up DTI References in Neutral Code"
echo ""

echo "### 6.1 Remove DTI imports from users-service"
echo "Path: workspace/services/users-service/"
echo "Actions:"
echo "  - Remove any remaining DTI references from handler code"
echo "  - Keep neutral claims and session logic (added in 2.2b2)"
echo ""
echo "Verification:"
echo '```bash'
echo "grep -rl 'destino\|Destino\|evaluaciones\|DestinationID\|evaluation\|ambito\|indicador' $PROJECT_ROOT/workspace/services/users-service/internal/ 2>/dev/null && echo 'WARN: DTI refs remain in users-service' || echo 'OK: no DTI refs in users-service'"
echo '```'
echo ""

echo "### 6.2 Remove DTI references from platform code"
echo "Path: workspace/backend/internal/platform/"
echo "Actions:"
echo "  - Ensure no DTI product terms exist in neutral platform packages"
echo "  - (identity, organizations, authorization, audit, configuration, entitlements, module, manifest, release)"
echo ""
echo "Verification:"
echo '```bash'
echo "grep -rl 'destino\|Destino\|DtiShell\|DtiLogo\|DestinationID\|evaluaciones\|ambito\|indicador' $PROJECT_ROOT/workspace/backend/internal/platform/ 2>/dev/null && echo 'WARN: DTI refs remain in platform' || echo 'OK: no DTI refs in platform'"
echo '```'
echo ""

# ─── Phase 7: Update Test Harnesses ───
echo "## Phase 7: Update Test Harnesses"
echo ""

echo "### 7.1 Remove or update harnesses referencing DTI services"
echo "Paths:"
echo "  - scripts/test-compose-contract.sh — remove evaluations-service checks"
echo "  - scripts/test-tenant-migration.sh — remove evaluations DB checks"
echo ""
echo "Actions: Update these harnesses to only validate remaining neutral services."
echo ""
echo "Verification:"
echo '```bash'
echo "grep -rl 'evaluations' $PROJECT_ROOT/scripts/test-compose-contract.sh $PROJECT_ROOT/scripts/test-tenant-migration.sh 2>/dev/null && echo 'WARN: evaluation refs remain in test harnesses' || echo 'OK: no evaluation refs in test harnesses'"
echo '```'
echo ""

# ─── Phase 8: Final Verification ───
echo "## Phase 8: Final Verification"
echo ""

echo "Run the full verification suite:"
echo '```bash'
echo "bash $PROJECT_ROOT/workspace/backend/scripts/verify-neutral-release.sh"
echo '```'
echo ""

echo "Expected checks (all must pass):"
echo "  - Backend compiles: go build ./..."
echo "  - No DTI imports: grep for DTI terms in neutral code returns empty"
echo "  - Compat adapters functional: compat tests pass"
echo "  - Reference module works: reference module tests pass"
echo "  - Platform regression: all platform tests pass"
echo "  - Neutral shell exists: NeutralShell.tsx intact"
echo "  - Both-mode boot: DtiShell and NeutralShell coexist"
echo ""

echo "Rollback:"
echo "  git checkout 61d1204432f23292c5236261da98b647fbb14be9 -- workspace/services/evaluations-service/"
echo "  git checkout 61d1204432f23292c5236261da98b647fbb14be9 -- workspace/frontend/app/'(dti)'/"
echo "  git checkout 61d1204432f23292c5236261da98b647fbb14be9 -- workspace/frontend/components/templates/DtiShell.tsx"
echo "  (Or full restore: git checkout 61d1204432f23292c5236261da98b647fbb14be9 -- .)"
echo ""

echo "=============================================="
echo " DTI Removal Plan Complete"
echo " Phase count: 8"
echo " Removal steps: ~28"
echo " Generated files require core-cli regeneration"
echo "=============================================="
