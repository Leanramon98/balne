package email

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

//go:embed templates/*.html
var embeddedHTML embed.FS

// TemplateEngine renders HTML email templates.
// Templates are embedded at build time, but can be overridden at runtime
// via the EMAIL_TEMPLATES_DIR env var — a designer can edit the files
// without touching Go code.
type TemplateEngine struct {
	embedded fs.FS
	extDir   string
	funcMap  template.FuncMap
	cache    map[string]*template.Template
	mu       sync.RWMutex
}

// NewTemplateEngine creates a template engine that loads from embedded
// templates/ and optionally overrides from extDir (env EMAIL_TEMPLATES_DIR).
func NewTemplateEngine(extDir string) *TemplateEngine {
	return &TemplateEngine{
		embedded: embeddedHTML,
		extDir:   extDir,
		funcMap: template.FuncMap{
			"safeHTML": func(s string) template.HTML { return template.HTML(s) },
			"upper":    strings.ToUpper,
		},
		cache: make(map[string]*template.Template),
	}
}

// Render parses and executes the template identified by fileName (e.g. "welcome.html")
// with the given data. Returns the rendered HTML string.
//
// External templates (EMAIL_TEMPLATES_DIR) are read from disk on EVERY render —
// no cache, so a designer's edits take effect immediately without reloading.
// Embedded templates are cached once at first use (they can't change at runtime).
func (e *TemplateEngine) Render(fileName string, data any) (string, error) {
	// Check if external file exists — if so, render fresh every time (no cache)
	if e.extDir != "" {
		extPath := filepath.Join(e.extDir, fileName)
		if _, err := os.Stat(extPath); err == nil {
			t, err := template.New(fileName).Funcs(e.funcMap).ParseFiles(extPath)
			if err != nil {
				return "", fmt.Errorf("parse external %s: %w", extPath, err)
			}
			var buf bytes.Buffer
			if err := t.Execute(&buf, data); err != nil {
				return "", fmt.Errorf("execute %s: %w", fileName, err)
			}
			return buf.String(), nil
		}
	}

	// Embedded: cache after first parse (they're compiled into the binary)
	e.mu.RLock()
	t, cached := e.cache[fileName]
	e.mu.RUnlock()

	if !cached {
		var err error
		t, err = e.parseEmbedded(fileName)
		if err != nil {
			return "", err
		}
		e.mu.Lock()
		e.cache[fileName] = t
		e.mu.Unlock()
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("execute %s: %w", fileName, err)
	}
	return buf.String(), nil
}

// parseEmbedded parses a template from the embedded filesystem.
func (e *TemplateEngine) parseEmbedded(fileName string) (*template.Template, error) {
	embeddedPath := "templates/" + fileName
	t, err := template.New(fileName).Funcs(e.funcMap).ParseFS(e.embedded, embeddedPath)
	if err != nil {
		return nil, fmt.Errorf("parse embedded %s: %w", fileName, err)
	}
	return t, nil
}

// Reload clears the template cache so templates are re-read from disk.
// Call this if a designer modifies a template file at runtime.
func (e *TemplateEngine) Reload() {
	e.mu.Lock()
	e.cache = make(map[string]*template.Template)
	e.mu.Unlock()
}
