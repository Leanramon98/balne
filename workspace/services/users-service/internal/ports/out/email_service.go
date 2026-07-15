package portout

// EmailService is the driven port for sending emails.
// Implement this in internal/adapters/out/email/.
type EmailService interface {
	// SendEmail sends an email to the given recipient.
	// Implementations may log, use SMTP, or call an external API.
	SendEmail(to, subject, body string) error
}
