package postgres

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"users-service/internal/domain"
	"users-service/internal/usecases"
)

// compile-time checks: ensure repos satisfy use case interfaces
var _ usecases.UserRepository = (*UserRepo)(nil)
var _ usecases.RoleRepository = (*RoleRepo)(nil)

// OrgRepo and MembershipRepo stubs for compile-time checks against usecase interfaces.
// These will be replaced by real PostgreSQL-backed implementations.
type orgRepo struct{}

func (o *orgRepo) FindByPrincipalID(ctx context.Context, _ uuid.UUID) (*domain.Organization, error) {
	panic("implement me")
}

type membershipRepo struct{}

func (m *membershipRepo) FindByPrincipalID(ctx context.Context, _ uuid.UUID) (*domain.Membership, error) {
	panic("implement me")
}

var _ usecases.OrganizationRepository = (*orgRepo)(nil)
var _ usecases.MembershipRepository = (*membershipRepo)(nil)

func TestRepoSatisfyInterfaces(t *testing.T) {
	// The compile-time checks above verify that UserRepo and RoleRepo
	// implement the usecases.UserRepository and usecases.RoleRepository interfaces.
	// If this test compiles and runs, the interfaces are satisfied.
	t.Log("UserRepo satisfies usecases.UserRepository")
	t.Log("RoleRepo satisfies usecases.RoleRepository")
	t.Log("orgRepo satisfies usecases.OrganizationRepository")
	t.Log("membershipRepo satisfies usecases.MembershipRepository")
}
