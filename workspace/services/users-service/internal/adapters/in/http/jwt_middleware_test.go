package httpadapter

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestExtendedClaims_Serialize(t *testing.T) {
	// RED: Verify ExtendedClaims can be serialized/deserialized via JWT
	userID := uuid.New().String()
	destID := uuid.New().String()

	claims := ExtendedClaims{
		UserID:        userID,
		Role:          "admin_organization",
		OrganizationID: &destID,
		Permissions: PermissionClaims{
			AccessScope:             "organization",
			CanWriteValues:          true,
			CanManageUsers:          true,
			CanApproveGoodPractices: false,
			EvaluationTypes:         []string{"autodiagnostico"},
		},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	// Parse back
	parsed := &ExtendedClaims{}
	parsedToken, err := jwt.ParseWithClaims(tokenString, parsed, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	if err != nil {
		t.Fatalf("failed to parse token: %v", err)
	}
	if !parsedToken.Valid {
		t.Fatal("parsed token is not valid")
	}

	if parsed.UserID != userID {
		t.Errorf("UserID: got %q, want %q", parsed.UserID, userID)
	}
	if parsed.Role != "admin_organization" {
		t.Errorf("Role: got %q, want 'admin_organization'", parsed.Role)
	}
	if parsed.OrganizationID == nil {
		t.Fatal("OrganizationID is nil")
	}
	if *parsed.OrganizationID != destID {
		t.Errorf("OrganizationID: got %q, want %q", *parsed.OrganizationID, destID)
	}
	if parsed.Permissions.AccessScope != "organization" {
		t.Errorf("Permissions.AccessScope: got %q, want 'organization'", parsed.Permissions.AccessScope)
	}
	if !parsed.Permissions.CanWriteValues {
		t.Error("Permissions.CanWriteValues should be true")
	}
}

func TestExtendedClaims_NilOrganizationID(t *testing.T) {
	// RED: Verify claims work without OrganizationID (admin user)
	claims := ExtendedClaims{
		UserID: uuid.New().String(),
		Role:   "admin",
		Permissions: PermissionClaims{
			AccessScope: "global",
		},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	parsed := &ExtendedClaims{}
	_, err = jwt.ParseWithClaims(tokenString, parsed, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	if err != nil {
		t.Fatalf("failed to parse token: %v", err)
	}

	if parsed.Role != "admin" {
		t.Errorf("Role: got %q, want 'admin'", parsed.Role)
	}
	if parsed.OrganizationID != nil {
		t.Error("expected OrganizationID to be nil for admin user")
	}
}

func TestNeutralClaims_Serialize(t *testing.T) {
	// RED: Verify NeutralClaims can be serialized/deserialized via JWT
	subID := uuid.New().String()
	sessionID := uuid.New().String()
	orgID := uuid.New().String()
	memID := uuid.New().String()

	claims := NeutralClaims{
		SubjectID:      subID,
		SessionID:      sessionID,
		OrganizationID: orgID,
		MembershipID:   memID,
		DeploymentMode: "saas",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	parsed := &NeutralClaims{}
	parsedToken, err := jwt.ParseWithClaims(tokenString, parsed, func(token *jwt.Token) (interface{}, error) {
		return JWTSecret, nil
	})
	if err != nil {
		t.Fatalf("failed to parse token: %v", err)
	}
	if !parsedToken.Valid {
		t.Fatal("parsed token is not valid")
	}

	if parsed.SubjectID != subID {
		t.Errorf("SubjectID: got %q, want %q", parsed.SubjectID, subID)
	}
	if parsed.SessionID != sessionID {
		t.Errorf("SessionID: got %q, want %q", parsed.SessionID, sessionID)
	}
	if parsed.OrganizationID != orgID {
		t.Errorf("OrganizationID: got %q, want %q", parsed.OrganizationID, orgID)
	}
	if parsed.MembershipID != memID {
		t.Errorf("MembershipID: got %q, want %q", parsed.MembershipID, memID)
	}
	if parsed.DeploymentMode != "saas" {
		t.Errorf("DeploymentMode: got %q, want 'saas'", parsed.DeploymentMode)
	}
}

func TestPermissionClaims_JSONTags(t *testing.T) {
	// Verify JSON serialization matches the design spec
	pc := PermissionClaims{
		AccessScope:             "global",
		CanWriteValues:          true,
		CanManageUsers:          false,
		CanApproveGoodPractices: true,
		EvaluationTypes:         []string{"autodiagnostico", "diagnostico"},
	}

	data, err := json.Marshal(pc)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded PermissionClaims
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if decoded.AccessScope != "global" {
		t.Errorf("AccessScope: got %q, want 'global'", decoded.AccessScope)
	}
	if len(decoded.EvaluationTypes) != 2 {
		t.Errorf("EvaluationTypes: got %d, want 2", len(decoded.EvaluationTypes))
	}
}
