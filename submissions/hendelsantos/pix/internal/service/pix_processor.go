package service

import (
	"context"
	"math/rand"
	"time"

	"github.com/hendelsantos/conty-pix-challenge/internal/config"
	"github.com/hendelsantos/conty-pix-challenge/internal/domain"
	"github.com/sirupsen/logrus"
)

type pixProcessor struct {
	config *config.PIXConfig
	logger *logrus.Logger
}

// NewPIXProcessor creates a new PIX processor
func NewPIXProcessor(config *config.PIXConfig, logger *logrus.Logger) domain.PIXProcessor {
	return &pixProcessor{
		config: config,
		logger: logger,
	}
}

func (p *pixProcessor) ProcessPayment(ctx context.Context, payout *domain.Payout) error {
	// Simulate processing delay
	delay := time.Duration(rand.Intn(p.config.MaxDelayMs-p.config.MinDelayMs)+p.config.MinDelayMs) * time.Millisecond
	
	p.logger.WithFields(logrus.Fields{
		"external_id":   payout.ExternalID,
		"amount_cents":  payout.AmountCents,
		"pix_key":       payout.PIXKey,
		"delay_ms":      delay.Milliseconds(),
	}).Info("Processing PIX payment")
	
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(delay):
		// Continue processing
	}
	
	// Simulate success/failure based on success rate
	if rand.Float64() > p.config.SuccessRate {
		return &PIXError{
			Code:    "PROCESSING_FAILED",
			Message: "PIX payment processing failed",
		}
	}
	
	p.logger.WithFields(logrus.Fields{
		"external_id": payout.ExternalID,
		"amount_cents": payout.AmountCents,
	}).Info("PIX payment processed successfully")
	
	return nil
}

// PIXError represents a PIX processing error
type PIXError struct {
	Code    string
	Message string
}

func (e *PIXError) Error() string {
	return e.Message
}