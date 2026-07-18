// Package audit provides neutral audit logging for the platform core.
// Every access attempt (allowed or denied) is recorded for accountability.
package audit

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"

	"project-base/backend/internal/platform/authorization"
)

// Entry represents a single audit record for an access attempt.
type Entry struct {
	ID             uuid.UUID
	ActorID        uuid.UUID
	OrganizationID uuid.UUID
	Action         string
	ResourceType   string
	ResourceID     string
	Outcome        string // "allow" or "deny"
	Reason         string
	Timestamp      time.Time
	Metadata       map[string]string
}

// Filter constrains audit log queries. Nil fields are not filtered.
type Filter struct {
	ActorID        *uuid.UUID
	OrganizationID *uuid.UUID
	Action         *string
	Outcome        *string
	Since          *time.Time
	Until          *time.Time
}

// AuditLog persists and retrieves audit entries.
type AuditLog interface {
	Record(ctx context.Context, entry Entry) error
	Query(ctx context.Context, filter Filter) ([]Entry, error)
}

// MemoryAuditLog is an in-memory implementation of AuditLog for testing and development.
type MemoryAuditLog struct {
	mu      sync.RWMutex
	entries []Entry
}

// NewMemoryAuditLog creates an empty in-memory audit log.
func NewMemoryAuditLog() *MemoryAuditLog {
	return &MemoryAuditLog{}
}

// Record appends an entry to the in-memory store.
func (l *MemoryAuditLog) Record(_ context.Context, entry Entry) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.entries = append(l.entries, entry)
	return nil
}

// Query returns entries matching the given filter.
func (l *MemoryAuditLog) Query(_ context.Context, filter Filter) ([]Entry, error) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	var result []Entry
	for _, entry := range l.entries {
		if filter.ActorID != nil && entry.ActorID != *filter.ActorID {
			continue
		}
		if filter.OrganizationID != nil && entry.OrganizationID != *filter.OrganizationID {
			continue
		}
		if filter.Action != nil && entry.Action != *filter.Action {
			continue
		}
		if filter.Outcome != nil && entry.Outcome != *filter.Outcome {
			continue
		}
		if filter.Since != nil && entry.Timestamp.Before(*filter.Since) {
			continue
		}
		if filter.Until != nil && entry.Timestamp.After(*filter.Until) {
			continue
		}
		result = append(result, entry)
	}
	return result, nil
}

// AuditMiddleware wraps a PolicyEngine and AuditLog, recording every authorization outcome.
type AuditMiddleware struct {
	Policy authorization.PolicyEngine
	Log    AuditLog
}

// Authorize delegates to the policy engine and records the outcome in the audit log.
func (m *AuditMiddleware) Authorize(ctx context.Context, action string, resource authorization.Resource, principal authorization.Principal, tenant authorization.TenantContext) authorization.Decision {
	result := m.Policy.Authorize(ctx, action, resource, principal, tenant)

	entry := Entry{
		ID:             uuid.New(),
		ActorID:        principal.ID,
		OrganizationID: tenant.OrganizationID,
		Action:         action,
		ResourceType:   resource.Type,
		ResourceID:     resource.ID,
		Outcome:        string(result),
		Timestamp:      time.Now().UTC(),
	}

	// Best-effort audit recording — log errors but never fail the request
	_ = m.Log.Record(ctx, entry)

	return result
}
