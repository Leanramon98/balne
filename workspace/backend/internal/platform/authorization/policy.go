// Package authorization defines neutral policy enforcement for the platform core.
// It provides RBAC authorization, tenant isolation, and fail-closed error handling.
package authorization

import (
	"context"

	"github.com/google/uuid"
)

// Decision is the result of an authorization check.
type Decision string

const (
	Allow Decision = "allow"
	Deny  Decision = "deny"
)

// WithReason returns Deny — the reason is carried by the caller, not the type.
func (d Decision) WithReason(_ string) Decision { return d }

// DeploymentMode distinguishes SaaS (multi-tenant) from Dedicated (single-tenant).
type DeploymentMode string

const (
	ModeSaaS      DeploymentMode = "saas"
	ModeDedicated DeploymentMode = "dedicated"
)

// TenantContext carries the authenticated tenant and principal context.
type TenantContext struct {
	OrganizationID uuid.UUID
	PrincipalID    uuid.UUID
	MembershipID   uuid.UUID
	DeploymentMode DeploymentMode
}

// Resource identifies the resource being accessed.
type Resource struct {
	Type           string
	ID             string
	OrganizationID uuid.UUID
}

// Principal represents the entity requesting access.
type Principal struct {
	ID          uuid.UUID
	Permissions []string
}

// PolicyEngine evaluates authorization decisions.
type PolicyEngine interface {
	Authorize(ctx context.Context, action string, resource Resource, principal Principal, tenant TenantContext) Decision
}

// RBACPolicy implements PolicyEngine using role-based access control.
// It checks that the principal has the required permission and enforces
// tenant isolation (cross-tenant requests are denied).
type RBACPolicy struct {
	// DedicatedOrganizationID, when non-nil, restricts access to a single
	// organization in dedicated deployment mode.
	DedicatedOrganizationID *uuid.UUID
}

// Authorize evaluates whether the principal is allowed to perform the given
// action on the resource within the tenant context.
func (p *RBACPolicy) Authorize(_ context.Context, action string, resource Resource, principal Principal, tenant TenantContext) Decision {
	// Reject empty/missing tenant context
	if tenant.OrganizationID == uuid.Nil {
		return Deny
	}

	// In dedicated mode, only the configured organization is accessible
	if tenant.DeploymentMode == ModeDedicated && p.DedicatedOrganizationID != nil {
		if resource.OrganizationID != *p.DedicatedOrganizationID {
			return Deny
		}
	}

	// Tenant isolation: resource must belong to the same organization as the principal
	if resource.OrganizationID != tenant.OrganizationID {
		return Deny
	}

	// Check if principal has the required permission
	for _, perm := range principal.Permissions {
		if perm == action {
			return Allow
		}
	}

	return Deny
}

// FailClosedPolicy wraps a PolicyEngine and catches panics, returning Deny on error.
type FailClosedPolicy struct {
	Inner PolicyEngine
}

// Authorize delegates to the inner engine, returning Deny if a panic occurs.
func (p *FailClosedPolicy) Authorize(ctx context.Context, action string, resource Resource, principal Principal, tenant TenantContext) (d Decision) {
	defer func() {
		if r := recover(); r != nil {
			d = Deny
		}
	}()
	return p.Inner.Authorize(ctx, action, resource, principal, tenant)
}
