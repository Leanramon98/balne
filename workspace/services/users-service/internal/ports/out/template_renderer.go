package portout

// TemplateRenderer renders email templates into HTML strings.
// Implementations may embed templates or load from external files.
type TemplateRenderer interface {
	// Render renders the template identified by fileName (e.g. "welcome.html")
	// with the given data and returns the HTML string.
	Render(fileName string, data any) (string, error)
}
