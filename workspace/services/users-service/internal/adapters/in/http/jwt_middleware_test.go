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
		UserID: userID,
		Role:   "admin_destino",
		DestinationID: &destID,
		Permissions: PermissionClaims{
			AccessScope:             "destination",
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
	if parsed.Role != "admin_destino" {
		t.Errorf("Role: got %q, want 'admin_destino'", parsed.Role)
	}
	if parsed.DestinationID == nil {
		t.Fatal("DestinationID is nil")
	}
	if *parsed.DestinationID != destID {
		t.Errorf("DestinationID: got %q, want %q", *parsed.DestinationID, destID)
	}
	if parsed.Permissions.AccessScope != "destination" {
		t.Errorf("Permissions.AccessScope: got %q, want 'destination'", parsed.Permissions.AccessScope)
	}
	if !parsed.Permissions.CanWriteValues {
		t.Error("Permissions.CanWriteValues should be true")
	}
}

func TestExtendedClaims_NilDestinationID(t *testing.T) {
	// RED: Verify claims work without DestinationID (admin user)
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
	if parsed.DestinationID != nil {
		t.Error("expected DestinationID to be nil for admin user")
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
