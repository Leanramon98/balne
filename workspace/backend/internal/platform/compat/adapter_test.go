package compat

import (
	"testing"
)

func TestNewRegistry_IsEmpty(t *testing.T) {
	r := NewRegistry()
	if r == nil {
		t.Fatal("NewRegistry() returned nil")
	}
	if len(r.RouteIDs()) != 0 {
		t.Fatalf("RouteIDs() = %v, want []", r.RouteIDs())
	}
	if len(r.DataIDs()) != 0 {
		t.Fatalf("DataIDs() = %v, want []", r.DataIDs())
	}
}

func TestRegisterRoute_Resolves(t *testing.T) {
	r := NewRegistry()
	adapter := &testRouteAdapter{legacy: "/api/old/destinations", newPath: "/api/new/destinations"}
	if err := r.RegisterRoute(adapter); err != nil {
		t.Fatalf("RegisterRoute() error = %v", err)
	}
	got, ok := r.ResolveRoute("/api/old/destinations")
	if !ok {
		t.Fatal("ResolveRoute() ok = false, want true")
	}
	if got != "/api/new/destinations" {
		t.Fatalf("ResolveRoute() = %q, want %q", got, "/api/new/destinations")
	}
}

func TestRegisterRoute_CollisionRejected(t *testing.T) {
	r := NewRegistry()
	a1 := &testRouteAdapter{legacy: "/api/old/foo", newPath: "/api/new/foo"}
	a2 := &testRouteAdapter{legacy: "/api/old/foo", newPath: "/api/new/bar"}
	if err := r.RegisterRoute(a1); err != nil {
		t.Fatal(err)
	}
	if err := r.RegisterRoute(a2); err == nil {
		t.Fatal("expected collision error, got nil")
	}
}

func TestResolveRoute_UnknownReturns404(t *testing.T) {
	r := NewRegistry()
	_, ok := r.ResolveRoute("/api/old/nonexistent")
	if ok {
		t.Fatal("ResolveRoute() ok = true for unknown route, want false")
	}
}

func TestEmptyLegacyData_AdaptHandlesGracefully(t *testing.T) {
	r := NewRegistry()
	adapter := &testDataAdapter{source: "destination"}
	if err := r.RegisterData(adapter); err != nil {
		t.Fatal(err)
	}
	// nil data
	result, err := r.AdaptData("destination", nil)
	if err != nil {
		t.Fatalf("AdaptData(nil) error = %v", err)
	}
	if result == nil {
		t.Fatal("AdaptData(nil) returned nil result, want empty map")
	}
	// empty map data
	result, err = r.AdaptData("destination", map[string]any{})
	if err != nil {
		t.Fatalf("AdaptData(empty) error = %v", err)
	}
	if result == nil {
		t.Fatal("AdaptData(empty) returned nil result, want empty map")
	}
}

func TestEmptyLegacyData_RevertHandlesGracefully(t *testing.T) {
	r := NewRegistry()
	adapter := &testDataAdapter{source: "destination"}
	if err := r.RegisterData(adapter); err != nil {
		t.Fatal(err)
	}
	result, err := r.RevertData("destination", nil)
	if err != nil {
		t.Fatalf("RevertData(nil) error = %v", err)
	}
	if result == nil {
		t.Fatal("RevertData(nil) returned nil result, want empty map")
	}
	result, err = r.RevertData("destination", map[string]any{})
	if err != nil {
		t.Fatalf("RevertData(empty) error = %v", err)
	}
	if result == nil {
		t.Fatal("RevertData(empty) returned nil result, want empty map")
	}
}

func TestUnknownData_ReturnsError(t *testing.T) {
	r := NewRegistry()
	_, err := r.AdaptData("unknown", map[string]any{"name": "test"})
	if err == nil {
		t.Fatal("AdaptData(unknown) error = nil, want non-nil")
	}
	_, err = r.RevertData("unknown", map[string]any{"name": "test"})
	if err == nil {
		t.Fatal("RevertData(unknown) error = nil, want non-nil")
	}
}

func TestMultipleAdapters_ComposeWithoutCollision(t *testing.T) {
	r := NewRegistry()
	routes := []*testRouteAdapter{
		{legacy: "/api/old/a", newPath: "/api/new/a"},
		{legacy: "/api/old/b", newPath: "/api/new/b"},
		{legacy: "/api/old/c", newPath: "/api/new/c"},
	}
	for i, ra := range routes {
		if err := r.RegisterRoute(ra); err != nil {
			t.Fatalf("route %d RegisterRoute() error = %v", i, err)
		}
	}
	datas := []*testDataAdapter{
		{source: "type-a", legacyField: "la", neutralField: "na"},
		{source: "type-b", legacyField: "lb", neutralField: "nb"},
	}
	for i, da := range datas {
		if err := r.RegisterData(da); err != nil {
			t.Fatalf("data %d RegisterData() error = %v", i, err)
		}
	}
	// Verify each route resolves correctly
	for _, ra := range routes {
		got, ok := r.ResolveRoute(ra.legacy)
		if !ok {
			t.Fatalf("ResolveRoute(%q) ok = false", ra.legacy)
		}
		if got != ra.newPath {
			t.Fatalf("ResolveRoute(%q) = %q, want %q", ra.legacy, got, ra.newPath)
		}
	}
	// Verify each data adapter works
	for _, da := range datas {
		input := map[string]any{da.legacyField: "value"}
		adapted, err := r.AdaptData(da.source, input)
		if err != nil {
			t.Fatalf("AdaptData(%q) error = %v", da.source, err)
		}
		if adapted[da.neutralField] != "value" {
			t.Fatalf("AdaptData(%q)[%q] = %v, want %q", da.source, da.neutralField, adapted[da.neutralField], "value")
		}
	}
}

func TestRemoveRoute_DoesNotBreakRemaining(t *testing.T) {
	r := NewRegistry()
	a1 := &testRouteAdapter{legacy: "/api/old/a", newPath: "/api/new/a"}
	a2 := &testRouteAdapter{legacy: "/api/old/b", newPath: "/api/new/b"}
	if err := r.RegisterRoute(a1); err != nil {
		t.Fatal(err)
	}
	if err := r.RegisterRoute(a2); err != nil {
		t.Fatal(err)
	}
	r.RemoveRoute("/api/old/a")
	// Removed route not found
	if _, ok := r.ResolveRoute("/api/old/a"); ok {
		t.Fatal("ResolveRoute(/api/old/a) ok = true after remove, want false")
	}
	// Remaining route still works
	got, ok := r.ResolveRoute("/api/old/b")
	if !ok {
		t.Fatal("ResolveRoute(/api/old/b) ok = false after removal of a, want true")
	}
	if got != "/api/new/b" {
		t.Fatalf("ResolveRoute(/api/old/b) = %q, want %q", got, "/api/new/b")
	}
}

func TestRemoveData_DoesNotBreakRemaining(t *testing.T) {
	r := NewRegistry()
	d1 := &testDataAdapter{source: "type-a", legacyField: "la", neutralField: "na"}
	d2 := &testDataAdapter{source: "type-b", legacyField: "lb", neutralField: "nb"}
	if err := r.RegisterData(d1); err != nil {
		t.Fatal(err)
	}
	if err := r.RegisterData(d2); err != nil {
		t.Fatal(err)
	}
	r.RemoveData("type-a")
	// Removed type not found
	if _, err := r.AdaptData("type-a", map[string]any{"la": "v"}); err == nil {
		t.Fatal("AdaptData(type-a) error = nil after remove, want non-nil")
	}
	// Remaining type still works
	result, err := r.AdaptData("type-b", map[string]any{"lb": "v"})
	if err != nil {
		t.Fatalf("AdaptData(type-b) error = %v after removal", err)
	}
	if result["nb"] != "v" {
		t.Fatalf("AdaptData(type-b)[nb] = %v, want v", result["nb"])
	}
}

func TestRoundTrip_PreservesData(t *testing.T) {
	r := NewRegistry()
	adapter := &testDataAdapter{
		source:       "destination",
		legacyField:  "old_name",
		neutralField: "name",
	}
	if err := r.RegisterData(adapter); err != nil {
		t.Fatal(err)
	}
	original := map[string]any{"old_name": "Buenos Aires", "population": 3000000}
	adapted, err := r.AdaptData("destination", original)
	if err != nil {
		t.Fatalf("AdaptData() error = %v", err)
	}
	reverted, err := r.RevertData("destination", adapted)
	if err != nil {
		t.Fatalf("RevertData() error = %v", err)
	}
	// Check every original field is present with the same value
	for k, v := range original {
		if reverted[k] != v {
			t.Fatalf("round-trip reverted[%q] = %v, want original %v", k, reverted[k], v)
		}
	}
}

func TestRouteIDs_ReturnsSorted(t *testing.T) {
	r := NewRegistry()
	_ = r.RegisterRoute(&testRouteAdapter{legacy: "/z/path", newPath: "/z/new"})
	_ = r.RegisterRoute(&testRouteAdapter{legacy: "/a/path", newPath: "/a/new"})
	_ = r.RegisterRoute(&testRouteAdapter{legacy: "/m/path", newPath: "/m/new"})
	ids := r.RouteIDs()
	if len(ids) != 3 {
		t.Fatalf("RouteIDs() length = %d, want 3", len(ids))
	}
	if ids[0] != "/a/path" || ids[1] != "/m/path" || ids[2] != "/z/path" {
		t.Fatalf("RouteIDs() = %v, want sorted [/a/path /m/path /z/path]", ids)
	}
}

func TestDataIDs_ReturnsSorted(t *testing.T) {
	r := NewRegistry()
	_ = r.RegisterData(&testDataAdapter{source: "z-type"})
	_ = r.RegisterData(&testDataAdapter{source: "a-type"})
	ids := r.DataIDs()
	if len(ids) != 2 {
		t.Fatalf("DataIDs() length = %d, want 2", len(ids))
	}
	if ids[0] != "a-type" || ids[1] != "z-type" {
		t.Fatalf("DataIDs() = %v, want sorted [a-type z-type]", ids)
	}
}

// --- test stubs ---

type testRouteAdapter struct {
	legacy  string
	newPath string
}

func (a *testRouteAdapter) LegacyPath() string { return a.legacy }
func (a *testRouteAdapter) NewPath() string     { return a.newPath }

type testDataAdapter struct {
	source       string
	legacyField  string
	neutralField string
}

func (a *testDataAdapter) SourceType() string { return a.source }

func (a *testDataAdapter) Adapt(legacy map[string]any) (map[string]any, error) {
	if legacy == nil {
		return map[string]any{}, nil
	}
	neutral := make(map[string]any, len(legacy))
	for k, v := range legacy {
		if k == a.legacyField {
			neutral[a.neutralField] = v
		} else {
			neutral[k] = v
		}
	}
	return neutral, nil
}

func (a *testDataAdapter) Revert(neutral map[string]any) (map[string]any, error) {
	if neutral == nil {
		return map[string]any{}, nil
	}
	legacy := make(map[string]any, len(neutral))
	for k, v := range neutral {
		if k == a.neutralField {
			legacy[a.legacyField] = v
		} else {
			legacy[k] = v
		}
	}
	return legacy, nil
}
