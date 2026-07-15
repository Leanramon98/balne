// Package messaging provides domain event publishing for the evaluations service.
// Events are published to a RabbitMQ topic exchange for consumption by workers
// (e.g., email sender, AI analysis worker).
package messaging

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// EventType represents the type of domain event.
type EventType string

const (
	// EventIndicatorMessageSent is emitted when a user sends a message on an indicator.
	EventIndicatorMessageSent EventType = "indicator.message.sent"
	// EventIndicatorAnalysisRequested is emitted when AI analysis is requested.
	EventIndicatorAnalysisRequested EventType = "indicator.analyze"
)

// MessageSentPayload is the event payload for indicator.message.sent.
type MessageSentPayload struct {
	IndicatorValueID uuid.UUID `json:"indicator_value_id"`
	UserID           uuid.UUID `json:"user_id"`
	Message          string    `json:"message"`
	CreatedAt        time.Time `json:"created_at"`
}

// AnalysisRequestedPayload is the event payload for indicator.analyze.
type AnalysisRequestedPayload struct {
	IndicatorValueID uuid.UUID `json:"indicator_value_id"`
	RequestedAt      time.Time `json:"requested_at"`
}

// Publisher defines the interface for publishing domain events to RabbitMQ.
type Publisher interface {
	// PublishIndicatorMessageSent publishes an indicator.message.sent event.
	PublishIndicatorMessageSent(ctx context.Context, payload MessageSentPayload) error

	// PublishIndicatorAnalysisRequested publishes an indicator.analyze event.
	PublishIndicatorAnalysisRequested(ctx context.Context, payload AnalysisRequestedPayload) error

	// Close cleans up the publisher connection.
	Close() error
}
