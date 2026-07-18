package module

import (
	"strings"
	"testing"
)

type stub struct{ descriptor Descriptor }

func (s stub) Descriptor() Descriptor { return s.descriptor }

func descriptor(id string) Descriptor {
	return Descriptor{
		ID: id, Routes: []Route{{Method: "GET", Path: "/" + id}},
		Permissions: []string{id + ".read"}, Migrations: []Migration{{ID: id + "-001", Order: 1}},
		Jobs: []string{id + ".cleanup"}, Events: []string{id + ".created"}, Health: id + ".health",
		RequiredCapabilities: []Capability{"postgres"},
	}
}

func TestNewRegistry_ValidComposition(t *testing.T) {
	registry, err := NewRegistry([]Module{stub{descriptor("notes")}, stub{descriptor("tasks")}}, []Capability{"postgres"})
	if err != nil {
		t.Fatalf("NewRegistry() error = %v", err)
	}
	if !registry.Has("notes") || len(registry.IDs()) != 2 {
		t.Fatalf("registry IDs = %v, want notes and tasks", registry.IDs())
	}
}

func TestNewRegistry_RejectsInvalidDescriptors(t *testing.T) {
	base := descriptor("notes")
	tests := []struct {
		name         string
		modules      []Module
		capabilities []Capability
		want         string
	}{
		{"duplicate module ID", []Module{stub{base}, stub{base}}, []Capability{"postgres"}, "duplicate module ID"},
		{"route collision", []Module{stub{base}, stub{withID(base, "tasks")}}, []Capability{"postgres"}, "route collision"},
		{"permission collision", []Module{stub{base}, stub{withPermission(base, "tasks")}}, []Capability{"postgres"}, "permission collision"},
		{"migration identity collision", []Module{stub{base}, stub{withMigration(base, "tasks")}}, []Capability{"postgres"}, "migration identity collision"},
		{"migration order", []Module{stub{withUnorderedMigrations(base)}}, []Capability{"postgres"}, "migration order"},
		{"missing capability", []Module{stub{base}}, nil, "missing required capability"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewRegistry(tt.modules, tt.capabilities)
			if err == nil || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("NewRegistry() error = %v, want %q", err, tt.want)
			}
		})
	}
}

func clone(value Descriptor) Descriptor {
	value.Routes = append([]Route(nil), value.Routes...)
	value.Permissions = append([]string(nil), value.Permissions...)
	value.Migrations = append([]Migration(nil), value.Migrations...)
	return value
}
func withID(value Descriptor, id string) Descriptor {
	value = clone(value)
	value.ID = id
	return value
}
func withPermission(value Descriptor, id string) Descriptor {
	value = withID(value, id)
	value.Routes[0].Path = "/" + id
	return value
}
func withMigration(value Descriptor, id string) Descriptor {
	value = withPermission(value, id)
	value.Permissions[0] = id + ".read"
	return value
}
func withUnorderedMigrations(value Descriptor) Descriptor {
	value = clone(value)
	value.Migrations = []Migration{{ID: "second", Order: 2}, {ID: "first", Order: 1}}
	return value
}
