package messaging

import (
	"context"
	"fmt"
	"log"
)

// NoOpPublisher is a publisher that logs events but does not actually send them.
// Used when RabbitMQ is not configured.
type NoOpPublisher struct {
	enabled bool
}

// NewNoOpPublisher creates a new NoOpPublisher.
// If enabled is true, events are logged; otherwise they are silently discarded.
func NewNoOpPublisher(enabled bool) *NoOpPublisher {
	return &NoOpPublisher{enabled: enabled}
}

func (p *NoOpPublisher) PublishIndicatorMessageSent(ctx context.Context, payload MessageSentPayload) error {
	if p.enabled {
		log.Printf("[EVENT] %s: indicator_value_id=%s user_id=%s message=%q",
			EventIndicatorMessageSent, payload.IndicatorValueID, payload.UserID, payload.Message)
	}
	return nil
}

func (p *NoOpPublisher) PublishIndicatorAnalysisRequested(ctx context.Context, payload AnalysisRequestedPayload) error {
	if p.enabled {
		log.Printf("[EVENT] %s: indicator_value_id=%s",
			EventIndicatorAnalysisRequested, payload.IndicatorValueID)
	}
	return nil
}

func (p *NoOpPublisher) Close() error {
	return nil
}

// Ensure NoOpPublisher implements Publisher at compile time.
var _ Publisher = (*NoOpPublisher)(nil)

// StaticRabbitMQConfig holds the connection configuration for RabbitMQ.
// Not used yet — will be wired when real RabbitMQ is available.
type StaticRabbitMQConfig struct {
	URL           string
	TopicExchange string
}

// DefaultTopicExchange is the default exchange name for indicator events.
const DefaultTopicExchange = "evaluations.indicator"

// Validate checks that the config has the minimum required fields.
func (c *StaticRabbitMQConfig) Validate() error {
	if c.URL == "" {
		return fmt.Errorf("rabbitmq URL is required")
	}
	if c.TopicExchange == "" {
		return fmt.Errorf("topic exchange is required")
	}
	return nil
}
