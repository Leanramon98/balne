package domain

import (
	"fmt"

	"github.com/google/uuid"
)

type DeploymentMode string

const (
	DeploymentModeSaaS      DeploymentMode = "saas"
	DeploymentModeDedicated DeploymentMode = "dedicated"
)

type Organization struct {
	ID uuid.UUID
}

type Membership struct {
	ID             uuid.UUID
	OrganizationID uuid.UUID
	PrincipalID    uuid.UUID
}

type TenantContext struct {
	OrganizationID uuid.UUID
	PrincipalID    uuid.UUID
	MembershipID   uuid.UUID
	DeploymentMode DeploymentMode
}

func ResolveTenantContext(
	principalID, organizationID, membershipID uuid.UUID,
	mode DeploymentMode,
	organizations []Organization,
	memberships []Membership,
) (TenantContext, error) {
	if principalID == uuid.Nil {
		return TenantContext{}, fmt.Errorf("principal ID is required")
	}
	if organizationID == uuid.Nil {
		return TenantContext{}, fmt.Errorf("organization ID is required")
	}
	if membershipID == uuid.Nil {
		return TenantContext{}, fmt.Errorf("membership ID is required")
	}

	switch mode {
	case DeploymentModeSaaS:
		if !hasOrganization(organizations, organizationID) {
			return TenantContext{}, fmt.Errorf("unknown organization %q", organizationID)
		}
	case DeploymentModeDedicated:
		if len(organizations) != 1 {
			return TenantContext{}, fmt.Errorf("dedicated mode requires exactly one organization")
		}
		if organizations[0].ID != organizationID {
			return TenantContext{}, fmt.Errorf("tenant does not match configured organization")
		}
	default:
		return TenantContext{}, fmt.Errorf("invalid deployment mode %q", mode)
	}

	for _, membership := range memberships {
		if membership.ID == membershipID && membership.PrincipalID == principalID && membership.OrganizationID == organizationID {
			return TenantContext{organizationID, principalID, membershipID, mode}, nil
		}
	}
	return TenantContext{}, fmt.Errorf("membership does not match principal and organization")
}

func hasOrganization(organizations []Organization, id uuid.UUID) bool {
	for _, organization := range organizations {
		if organization.ID == id {
			return true
		}
	}
	return false
}
