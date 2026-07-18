// Package module defines deployment-time module composition contracts.
package module

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
)

type Capability string

type Route struct {
	Method string
	Path   string
}

type Migration struct {
	ID    string
	Order int
}

type Descriptor struct {
	ID                   string
	Routes               []Route
	Permissions          []string
	Migrations           []Migration
	Jobs                 []string
	Events               []string
	Health               string
	RequiredCapabilities []Capability
}

type Module interface {
	Descriptor() Descriptor
}

type Registry struct {
	modules      map[string]Descriptor
	capabilities map[Capability]struct{}
}

var stableID = regexp.MustCompile(`^[a-z][a-z0-9-]*$`)

func claim(owners map[string]string, key, owner, kind string) error {
	if previous, exists := owners[key]; exists {
		return fmt.Errorf("%s collision %q between %q and %q", kind, key, previous, owner)
	}
	owners[key] = owner
	return nil
}

func NewRegistry(modules []Module, capabilities []Capability) (*Registry, error) {
	r := &Registry{modules: map[string]Descriptor{}, capabilities: map[Capability]struct{}{}}
	for _, capability := range capabilities {
		if capability == "" {
			return nil, fmt.Errorf("capability ID is required")
		}
		r.capabilities[capability] = struct{}{}
	}
	routes, permissions, migrations := map[string]string{}, map[string]string{}, map[string]string{}
	for _, candidate := range modules {
		d := candidate.Descriptor()
		if !stableID.MatchString(d.ID) {
			return nil, fmt.Errorf("invalid module ID %q", d.ID)
		}
		if _, exists := r.modules[d.ID]; exists {
			return nil, fmt.Errorf("duplicate module ID %q", d.ID)
		}
		for _, required := range d.RequiredCapabilities {
			if _, ok := r.capabilities[required]; !ok {
				return nil, fmt.Errorf("module %q missing required capability %q", d.ID, required)
			}
		}
		for _, route := range d.Routes {
			key := strings.ToUpper(route.Method) + " " + route.Path
			if err := claim(routes, key, d.ID, "route"); err != nil {
				return nil, err
			}
		}
		for _, permission := range d.Permissions {
			if err := claim(permissions, permission, d.ID, "permission"); err != nil {
				return nil, err
			}
		}
		previousOrder := -1
		for _, migration := range d.Migrations {
			if migration.ID == "" {
				return nil, fmt.Errorf("module %q migration ID is required", d.ID)
			}
			if migration.Order <= previousOrder {
				return nil, fmt.Errorf("module %q migration order must be strictly increasing", d.ID)
			}
			if err := claim(migrations, migration.ID, d.ID, "migration identity"); err != nil {
				return nil, err
			}
			previousOrder = migration.Order
		}
		r.modules[d.ID] = d
	}
	return r, nil
}

func (r *Registry) Has(id string) bool               { _, ok := r.modules[id]; return ok }
func (r *Registry) HasCapability(id Capability) bool { _, ok := r.capabilities[id]; return ok }
func (r *Registry) Get(id string) (Descriptor, bool) { value, ok := r.modules[id]; return value, ok }
func (r *Registry) IDs() []string {
	ids := make([]string, 0, len(r.modules))
	for id := range r.modules {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}
