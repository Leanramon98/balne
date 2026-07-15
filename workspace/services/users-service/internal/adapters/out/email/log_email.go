package email

import (
	"log"

	portout "users-service/internal/ports/out"
)

// LogEmailService implements portout.EmailService by logging to stdout.
// Useful for development; replace with a real SMTP/API adapter in production.
type LogEmailService struct{}

// NewLogEmailService constructs a new LogEmailService.
func NewLogEmailService() *LogEmailService {
	return &LogEmailService{}
}

// Ensure LogEmailService satisfies the driven port at compile time.
var _ portout.EmailService = (*LogEmailService)(nil)

// SendEmail logs the email details. In production this would actually send.
func (s *LogEmailService) SendEmail(to, subject, body string) error {
	log.Printf("[EMAIL] To: %s | Subject: %s | Body: %s", to, subject, body)
	return nil
}
