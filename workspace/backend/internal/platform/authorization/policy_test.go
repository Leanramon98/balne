package authorization

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestDecision_Values(t *testing.T) {
	if Allow != "allow" {
		t.Fatalf("Allow = %q, want %q", Allow, "allow")
	}
	if Deny != "deny" {
		t.Fatalf("Deny = %q, want %q", Deny, "deny")
	}
	if string(Allow) != "allow" {
		t.Fatalf("string(Allow) = %q", string(Allow))
	}
}

func TestDecision_WithReason(t *testing.T) {
	d := Deny.WithReason("missing permission")
	if d != Deny {
		t.Fatal("WithReason should return Deny")
	}
}

func TestTenantContext_Construction(t *testing.T) {
	orgID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	principalID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	membershipID := uuid.MustParse("33333333-3333-3333-3333-333333333333")

	tc := TenantContext{
		OrganizationID: orgID,
		PrincipalID:    principalID,
		MembershipID:   membershipID,
		DeploymentMode: ModeSaaS,
	}

	if tc.OrganizationID != orgID {
		t.Fatalf("OrganizationID = %v, want %v", tc.OrganizationID, orgID)
	}
	if tc.PrincipalID != principalID {
		t.Fatalf("PrincipalID = %v, want %v", tc.PrincipalID, principalID)
	}
	if tc.MembershipID != membershipID {
		t.Fatalf("MembershipID = %v, want %v", tc.MembershipID, membershipID)
	}
	if tc.DeploymentMode != ModeSaaS {
		t.Fatalf("DeploymentMode = %v, want SaaS", tc.DeploymentMode)
	}
}

func TestResource_Construction(t *testing.T) {
	orgID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	r := Resource{Type: "document", ID: "doc-123", OrganizationID: orgID}
	if r.Type != "document" || r.ID != "doc-123" || r.OrganizationID != orgID {
		t.Fatalf("Resource = %+v", r)
	}
}

func TestPrincipal_Construction(t *testing.T) {
	id := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	p := Principal{ID: id, Permissions: []string{"document.read", "document.write"}}
	if p.ID != id || len(p.Permissions) != 2 {
		t.Fatalf("Principal = %+v", p)
	}
}

// --- Spec scenario 1: Forged/invalid authority -> denial ---

func TestRBACPolicy_MissingTenantContext_ReturnsDeny(t *testing.T) {
	engine := &RBACPolicy{}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: uuid.Nil}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{} // empty / missing — no organization

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Deny {
		t.Fatalf("Authorize() with missing tenant = %v, want Deny", result)
	}
}

func TestRBACPolicy_NilOrganizationID_ReturnsDeny(t *testing.T) {
	engine := &RBACPolicy{}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: uuid.Nil}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{
		OrganizationID: uuid.Nil,
		DeploymentMode: ModeSaaS,
	}

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Deny {
		t.Fatalf("Authorize() with nil OrganizationID = %v, want Deny", result)
	}
}

// --- Spec scenario 2: Missing permission -> denial ---

func TestRBACPolicy_MissingPermission_ReturnsDeny(t *testing.T) {
	orgID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	engine := &RBACPolicy{}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: orgID}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{OrganizationID: orgID, DeploymentMode: ModeSaaS}

	// principal has document.read but not document.delete
	result := engine.Authorize(context.Background(), "document.delete", resource, principal, tenant)
	if result != Deny {
		t.Fatalf("Authorize() missing permission = %v, want Deny", result)
	}
}

// --- Spec scenario 3: Correct permission -> allowed ---

func TestRBACPolicy_CorrectPermission_ReturnsAllow(t *testing.T) {
	orgID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	engine := &RBACPolicy{}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: orgID}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read", "document.write"}}
	tenant := TenantContext{OrganizationID: orgID, DeploymentMode: ModeSaaS}

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Allow {
		t.Fatalf("Authorize() with correct permission = %v, want Allow", result)
	}
}

// --- Spec scenario 4: Fail-closed on error ---

func TestFailClosedPolicy_Panic_ReturnsDeny(t *testing.T) {
	inner := &panicEngine{}
	wrapped := &FailClosedPolicy{Inner: inner}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: uuid.MustParse("11111111-1111-1111-1111-111111111111")}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222")}
	tenant := TenantContext{OrganizationID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), DeploymentMode: ModeSaaS}

	result := wrapped.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Deny {
		t.Fatalf("FailClosedPolicy on panic = %v, want Deny", result)
	}
}

func TestFailClosedPolicy_NormalOperation_PassesThrough(t *testing.T) {
	orgID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	inner := &RBACPolicy{}
	wrapped := &FailClosedPolicy{Inner: inner}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: orgID}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{OrganizationID: orgID, DeploymentMode: ModeSaaS}

	result := wrapped.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Allow {
		t.Fatalf("FailClosedPolicy normal = %v, want Allow", result)
	}
}

// --- Spec scenario 6: Cross-tenant access denied ---

func TestRBACPolicy_CrossTenantAccess_ReturnsDeny(t *testing.T) {
	orgA := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	orgB := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	engine := &RBACPolicy{}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: orgB} // resource belongs to org B
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{OrganizationID: orgA, DeploymentMode: ModeSaaS} // principal is from org A

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Deny {
		t.Fatalf("Cross-tenant access = %v, want Deny", result)
	}
}

func TestRBACPolicy_SameTenant_AllowsAccess(t *testing.T) {
	orgID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	engine := &RBACPolicy{}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: orgID}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{OrganizationID: orgID, DeploymentMode: ModeSaaS}

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Allow {
		t.Fatalf("Same tenant access = %v, want Allow", result)
	}
}

// --- Spec scenario 7: Dedicated mode enforcement ---

func TestRBACPolicy_DedicatedMode_WrongOrg_ReturnsDeny(t *testing.T) {
	configuredOrg := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	wrongOrg := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	engine := &RBACPolicy{DedicatedOrganizationID: &configuredOrg}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: wrongOrg}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{OrganizationID: wrongOrg, DeploymentMode: ModeDedicated}

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Deny {
		t.Fatalf("Dedicated mode wrong org = %v, want Deny", result)
	}
}

func TestRBACPolicy_DedicatedMode_CorrectOrg_Allows(t *testing.T) {
	orgID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	engine := &RBACPolicy{DedicatedOrganizationID: &orgID}
	resource := Resource{Type: "document", ID: "doc-1", OrganizationID: orgID}
	principal := Principal{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), Permissions: []string{"document.read"}}
	tenant := TenantContext{OrganizationID: orgID, DeploymentMode: ModeDedicated}

	result := engine.Authorize(context.Background(), "document.read", resource, principal, tenant)
	if result != Allow {
		t.Fatalf("Dedicated mode correct org = %v, want Allow", result)
	}
}

// Helper: engine that panics for testing FailClosedPolicy
type panicEngine struct{}

func (e *panicEngine) Authorize(_ context.Context, _ string, _ Resource, _ Principal, _ TenantContext) Decision {
	panic("database unavailable")
}

// --- Decision string formatting ---

func TestDecision_String(t *testing.T) {
	if v := fmtDecision(Allow); !strings.Contains(v, "allow") {
		t.Fatalf("fmtDecision(Allow) = %q, want 'allow'", v)
	}
	if v := fmtDecision(Deny); !strings.Contains(v, "deny") {
		t.Fatalf("fmtDecision(Deny) = %q, want 'deny'", v)
	}
}

func fmtDecision(d Decision) string {
	return string(d)
}
