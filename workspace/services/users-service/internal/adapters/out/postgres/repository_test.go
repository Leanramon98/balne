package postgres

import (
	"testing"

	"users-service/internal/usecases"
)

// compile-time checks: ensure repos satisfy use case interfaces
var _ usecases.UserRepository = (*UserRepo)(nil)
var _ usecases.RoleRepository = (*RoleRepo)(nil)

func TestRepoSatisfyInterfaces(t *testing.T) {
	// The compile-time checks above verify that UserRepo and RoleRepo
	// implement the usecases.UserRepository and usecases.RoleRepository interfaces.
	// If this test compiles and runs, the interfaces are satisfied.
	t.Log("UserRepo satisfies usecases.UserRepository")
	t.Log("RoleRepo satisfies usecases.RoleRepository")
}
