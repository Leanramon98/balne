package domain

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

var (
	principalA = uuid.MustParse("10000000-0000-0000-0000-000000000001")
	principalB = uuid.MustParse("10000000-0000-0000-0000-000000000002")
	orgA       = uuid.MustParse("20000000-0000-0000-0000-000000000001")
	orgB       = uuid.MustParse("20000000-0000-0000-0000-000000000002")
	memberA    = uuid.MustParse("30000000-0000-0000-0000-000000000001")
)

func TestResolveTenantContext(t *testing.T) {
	organizations := []Organization{{ID: orgA}, {ID: orgB}}
	memberships := []Membership{{ID: memberA, OrganizationID: orgA, PrincipalID: principalA}}
	for _, test := range []struct {
		name string
		mode DeploymentMode
		orgs []Organization
	}{
		{"SaaS selects matching membership", DeploymentModeSaaS, organizations},
		{"dedicated selects its only organization", DeploymentModeDedicated, organizations[:1]},
	} {
		t.Run(test.name, func(t *testing.T) {
			context, err := ResolveTenantContext(principalA, orgA, memberA, test.mode, test.orgs, memberships)
			if err != nil {
				t.Fatal(err)
			}
			want := TenantContext{OrganizationID: orgA, PrincipalID: principalA, MembershipID: memberA, DeploymentMode: test.mode}
			if context != want {
				t.Fatalf("context = %+v, want %+v", context, want)
			}
		})
	}
}

func TestResolveTenantContextFailsClosed(t *testing.T) {
	validOrganizations := []Organization{{ID: orgA}, {ID: orgB}}
	validMemberships := []Membership{{ID: memberA, OrganizationID: orgA, PrincipalID: principalA}}
	tests := []struct {
		name               string
		principal, org, id uuid.UUID
		mode               DeploymentMode
		organizations      []Organization
		memberships        []Membership
		want               string
	}{
		{"missing principal", uuid.Nil, orgA, memberA, DeploymentModeSaaS, validOrganizations, validMemberships, "principal ID"},
		{"missing organization", principalA, uuid.Nil, memberA, DeploymentModeSaaS, validOrganizations, validMemberships, "organization ID"},
		{"missing membership", principalA, orgA, uuid.Nil, DeploymentModeSaaS, validOrganizations, validMemberships, "membership ID"},
		{"unknown organization", principalA, uuid.New(), memberA, DeploymentModeSaaS, validOrganizations, validMemberships, "unknown organization"},
		{"cross organization membership", principalA, orgB, memberA, DeploymentModeSaaS, validOrganizations, validMemberships, "membership does not match"},
		{"wrong principal", principalB, orgA, memberA, DeploymentModeSaaS, validOrganizations, validMemberships, "membership does not match"},
		{"dedicated cardinality", principalA, orgA, memberA, DeploymentModeDedicated, validOrganizations, validMemberships, "exactly one organization"},
		{"dedicated mismatch", principalA, orgA, memberA, DeploymentModeDedicated, []Organization{{ID: orgB}}, validMemberships, "configured organization"},
		{"invalid mode", principalA, orgA, memberA, DeploymentMode("invalid"), validOrganizations, validMemberships, "deployment mode"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := ResolveTenantContext(test.principal, test.org, test.id, test.mode, test.organizations, test.memberships)
			if err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("error = %v, want %q", err, test.want)
			}
		})
	}
}
