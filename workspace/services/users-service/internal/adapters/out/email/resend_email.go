package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	portout "users-service/internal/ports/out"
)

// ResendEmailService implements portout.EmailService via the Resend API.
// https://resend.com/docs/api-reference/emails/send-email
type ResendEmailService struct {
	apiKey string
	from   string
	client *http.Client
}

// NewResendEmailService creates a new Resend email sender.
// apiKey: your Resend API key (re_...)
// from: sender email address (must be verified in Resend)
func NewResendEmailService(apiKey, from string) *ResendEmailService {
	return &ResendEmailService{
		apiKey: apiKey,
		from:   from,
		client: &http.Client{},
	}
}

// Ensure ResendEmailService satisfies the driven port at compile time.
var _ portout.EmailService = (*ResendEmailService)(nil)

// resendPayload matches the Resend API /emails endpoint.
type resendPayload struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html,omitempty"`
	Text    string `json:"text,omitempty"`
}

// SendEmail sends an email via Resend.
// If body contains HTML tags, it's sent as HTML; otherwise as plain text.
func (s *ResendEmailService) SendEmail(to, subject, body string) error {
	payload := resendPayload{
		From:    s.from,
		To:      to,
		Subject: subject,
	}

	// Detect if body is HTML
	if strings.Contains(body, "<") && strings.Contains(body, ">") {
		payload.HTML = body
	} else {
		payload.Text = body
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("resend marshal: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("resend send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var buf bytes.Buffer
		buf.ReadFrom(resp.Body)
		log.Printf("[Resend] error response: %s (status %d)", buf.String(), resp.StatusCode)
		return fmt.Errorf("resend: API returned status %d", resp.StatusCode)
	}

	log.Printf("[Resend] email sent to %s — subject: %s", to, subject)
	return nil
}
