package audit

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"project-base/backend/internal/platform/authorization"
)

func TestEntry_Construction(t *testing.T) {
	id := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	now := time.Now().UTC().Truncate(time.Second)
	entry := Entry{
		ID:             id,
		ActorID:        uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
		OrganizationID: uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
		Action:         "document.read",
		ResourceType:   "document",
		ResourceID:     "doc-123",
		Outcome:        "allow",
		Reason:         "",
		Timestamp:      now,
		Metadata:       map[string]string{"ip": "10.0.0.1"},
	}

	if entry.ID != id {
		t.Fatalf("entry.ID = %v, want %v", entry.ID, id)
	}
	if entry.Outcome != "allow" {
		t.Fatalf("entry.Outcome = %q, want 'allow'", entry.Outcome)
	}
	if entry.Metadata["ip"] != "10.0.0.1" {
		t.Fatalf("entry.Metadata['ip'] = %q", entry.Metadata["ip"])
	}
}

// --- Spec scenario 5: Audit record created for every access ---

func TestMemoryAuditLog_RecordAndQuery_All(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	actorID := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

	entry1 := Entry{
		ID:             uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
		ActorID:        actorID,
		OrganizationID: orgID,
		Action:         "document.read",
		ResourceType:   "document",
		ResourceID:     "doc-1",
		Outcome:        "allow",
		Timestamp:      time.Now().UTC(),
	}
	entry2 := Entry{
		ID:             uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
		ActorID:        actorID,
		OrganizationID: orgID,
		Action:         "document.delete",
		ResourceType:   "document",
		ResourceID:     "doc-2",
		Outcome:        "deny",
		Reason:         "missing permission",
		Timestamp:      time.Now().UTC(),
	}

	if err := log.Record(ctx, entry1); err != nil {
		t.Fatalf("Record(entry1) error = %v", err)
	}
	if err := log.Record(ctx, entry2); err != nil {
		t.Fatalf("Record(entry2) error = %v", err)
	}

	// Query all
	entries, err := log.Query(ctx, Filter{})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("Query() returned %d entries, want 2", len(entries))
	}
}

func TestMemoryAuditLog_QueryByActorID(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	actorA := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	actorB := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

	mustRecord(log, ctx, Entry{ID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), ActorID: actorA, OrganizationID: orgID, Action: "read", ResourceType: "doc", Outcome: "allow", Timestamp: time.Now()})
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), ActorID: actorB, OrganizationID: orgID, Action: "write", ResourceType: "doc", Outcome: "deny", Timestamp: time.Now()})

	entries, err := log.Query(ctx, Filter{ActorID: &actorA})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("Query by ActorID returned %d entries, want 1", len(entries))
	}
	if entries[0].ActorID != actorA {
		t.Fatalf("entry ActorID = %v, want %v", entries[0].ActorID, actorA)
	}
}

func TestMemoryAuditLog_QueryByOutcome(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	actorID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

	outcomeDeny := "deny"
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), ActorID: actorID, OrganizationID: orgID, Action: "read", ResourceType: "doc", Outcome: "allow", Timestamp: time.Now()})
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), ActorID: actorID, OrganizationID: orgID, Action: "write", ResourceType: "doc", Outcome: "deny", Timestamp: time.Now()})

	entries, err := log.Query(ctx, Filter{Outcome: &outcomeDeny})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("Query by Outcome returned %d entries, want 1", len(entries))
	}
	if entries[0].Outcome != "deny" {
		t.Fatalf("entry Outcome = %q, want 'deny'", entries[0].Outcome)
	}
}

func TestMemoryAuditLog_QueryByAction(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	actorID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

	actionRead := "document.read"
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), ActorID: actorID, OrganizationID: orgID, Action: "document.read", ResourceType: "doc", Outcome: "allow", Timestamp: time.Now()})
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), ActorID: actorID, OrganizationID: orgID, Action: "document.delete", ResourceType: "doc", Outcome: "deny", Timestamp: time.Now()})

	entries, err := log.Query(ctx, Filter{Action: &actionRead})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("Query by Action returned %d entries, want 1", len(entries))
	}
	if entries[0].Action != "document.read" {
		t.Fatalf("entry Action = %q", entries[0].Action)
	}
}

func TestMemoryAuditLog_QueryByTimeRange(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	actorID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	now := time.Now()

	since := now.Add(-1 * time.Hour)
	until := now.Add(1 * time.Hour)

	mustRecord(log, ctx, Entry{ID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), ActorID: actorID, OrganizationID: orgID, Action: "read", ResourceType: "doc", Outcome: "allow", Timestamp: now})

	entries, err := log.Query(ctx, Filter{Since: &since, Until: &until})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("Query by time range returned %d entries, want 1", len(entries))
	}
}

func TestMemoryAuditLog_QueryOutOfRange_ReturnsEmpty(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	actorID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

	future := time.Now().Add(365 * 24 * time.Hour)
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("11111111-1111-1111-1111-111111111111"), ActorID: actorID, OrganizationID: orgID, Action: "read", ResourceType: "doc", Outcome: "allow", Timestamp: time.Now()})

	since := future
	entries, err := log.Query(ctx, Filter{Since: &since})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 0 {
		t.Fatalf("Query with future Since returned %d entries, want 0", len(entries))
	}
}

func TestMemoryAuditLog_QueryByOrganizationID(t *testing.T) {
	log := NewMemoryAuditLog()
	ctx := context.Background()
	orgA := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	orgB := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	actorID := uuid.MustParse("11111111-1111-1111-1111-111111111111")

	mustRecord(log, ctx, Entry{ID: uuid.MustParse("22222222-2222-2222-2222-222222222222"), ActorID: actorID, OrganizationID: orgA, Action: "read", ResourceType: "doc", Outcome: "allow", Timestamp: time.Now()})
	mustRecord(log, ctx, Entry{ID: uuid.MustParse("33333333-3333-3333-3333-333333333333"), ActorID: actorID, OrganizationID: orgB, Action: "write", ResourceType: "doc", Outcome: "deny", Timestamp: time.Now()})

	entries, err := log.Query(ctx, Filter{OrganizationID: &orgA})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("Query by OrganizationID returned %d entries, want 1", len(entries))
	}
}

// --- AuditMiddleware ---

type stubPolicy struct {
	result authorization.Decision
}

func (s *stubPolicy) Authorize(_ context.Context, _ string, _ authorization.Resource, _ authorization.Principal, _ authorization.TenantContext) authorization.Decision {
	return s.result
}

type stubPolicyWithAction struct {
	results map[string]authorization.Decision
}

func (s *stubPolicyWithAction) Authorize(_ context.Context, action string, _ authorization.Resource, _ authorization.Principal, _ authorization.TenantContext) authorization.Decision {
	if d, ok := s.results[action]; ok {
		return d
	}
	return authorization.Deny
}

func TestAuditMiddleware_Allow_RecordsOutcome(t *testing.T) {
	log := NewMemoryAuditLog()
	policy := &stubPolicy{result: authorization.Allow}
	mw := AuditMiddleware{Policy: policy, Log: log}
	ctx := context.Background()
	resource := authorization.Resource{Type: "document", ID: "doc-1", OrganizationID: uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")}
	principal := authorization.Principal{ID: uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Permissions: []string{"document.read"}}
	tenant := authorization.TenantContext{OrganizationID: uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc"), DeploymentMode: authorization.ModeSaaS}

	result := mw.Authorize(ctx, "document.read", resource, principal, tenant)
	if result != authorization.Allow {
		t.Fatalf("Authorize() = %v, want Allow", result)
	}

	entries, err := log.Query(ctx, Filter{})
	if err != nil {
		t.Fatalf("Query() error = %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected 1 audit entry, got %d", len(entries))
	}
	if entries[0].Outcome != "allow" {
		t.Fatalf("audit entry Outcome = %q, want 'allow'", entries[0].Outcome)
	}
	if entries[0].ActorID != principal.ID {
		t.Fatalf("audit entry ActorID = %v, want %v", entries[0].ActorID, principal.ID)
	}
	if entries[0].OrganizationID != tenant.OrganizationID {
		t.Fatalf("audit entry OrganizationID = %v, want %v", entries[0].OrganizationID, tenant.OrganizationID)
	}
	if entries[0].Action != "document.read" {
		t.Fatalf("audit entry Action = %q", entries[0].Action)
	}
	if entries[0].ResourceType != resource.Type {
		t.Fatalf("audit entry ResourceType = %q", entries[0].ResourceType)
	}
	if entries[0].ResourceID != resource.ID {
		t.Fatalf("audit entry ResourceID = %q", entries[0].ResourceID)
	}
}

func TestAuditMiddleware_Deny_RecordsOutcome(t *testing.T) {
	log := NewMemoryAuditLog()
	policy := &stubPolicy{result: authorization.Deny}
	mw := AuditMiddleware{Policy: policy, Log: log}
	ctx := context.Background()
	resource := authorization.Resource{Type: "document", ID: "doc-1", OrganizationID: uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")}
	principal := authorization.Principal{ID: uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Permissions: []string{}}
	tenant := authorization.TenantContext{OrganizationID: uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc"), DeploymentMode: authorization.ModeSaaS}

	result := mw.Authorize(ctx, "document.delete", resource, principal, tenant)
	if result != authorization.Deny {
		t.Fatalf("Authorize() = %v, want Deny", result)
	}

	entries, _ := log.Query(ctx, Filter{})
	if len(entries) != 1 {
		t.Fatalf("expected 1 audit entry, got %d", len(entries))
	}
	if entries[0].Outcome != "deny" {
		t.Fatalf("audit entry Outcome = %q, want 'deny'", entries[0].Outcome)
	}
}

func TestAuditMiddleware_MultipleCalls_RecordsAll(t *testing.T) {
	log := NewMemoryAuditLog()
	policy := &stubPolicyWithAction{
		results: map[string]authorization.Decision{
			"document.read":   authorization.Allow,
			"document.delete": authorization.Deny,
		},
	}
	mw := AuditMiddleware{Policy: policy, Log: log}
	ctx := context.Background()
	orgID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	resource := authorization.Resource{Type: "document", ID: "doc-1", OrganizationID: orgID}
	principal := authorization.Principal{ID: uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Permissions: []string{}}
	tenant := authorization.TenantContext{OrganizationID: orgID, DeploymentMode: authorization.ModeSaaS}

	mw.Authorize(ctx, "document.read", resource, principal, tenant)
	mw.Authorize(ctx, "document.delete", resource, principal, tenant)

	entries, _ := log.Query(ctx, Filter{})
	if len(entries) != 2 {
		t.Fatalf("expected 2 audit entries, got %d", len(entries))
	}
}

func mustRecord(log AuditLog, ctx context.Context, entry Entry) {
	if err := log.Record(ctx, entry); err != nil {
		panic(err)
	}
}
