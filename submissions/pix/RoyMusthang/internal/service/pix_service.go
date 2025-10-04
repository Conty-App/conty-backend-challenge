package service

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"RoyMusthang/internal/entity"
)

type PIXService struct {
	failureRate float64
}

func NewPIXService(failureRate float64) *PIXService {
	log.Printf("[INFO] PIXService initialized with failureRate=%.2f", failureRate)
	return &PIXService{failureRate: failureRate}
}

func (s *PIXService) ProcessPayment(item entity.PaymentItem) error {
	log.Printf("[DEBUG] Processing PIX payment: ExternalID=%s UserID=%s AmountCents=%d PixKey=%s",
		item.ExternalID, item.UserID, item.AmountCents, item.PixKey)

	// Simulate network delay
	delay := time.Duration(50+rand.Intn(200)) * time.Millisecond
	log.Printf("[DEBUG] Simulating network delay: %v", delay)
	time.Sleep(delay)

	// Validate basic business rules
	if item.AmountCents <= 0 {
		err := fmt.Errorf("invalid amount: must be positive")
		log.Printf("[ERROR] Payment validation failed: ExternalID=%s Error=%s", item.ExternalID, err)
		return err
	}
	if item.PixKey == "" {
		err := fmt.Errorf("pix_key is required")
		log.Printf("[ERROR] Payment validation failed: ExternalID=%s Error=%s", item.ExternalID, err)
		return err
	}

	// Simulate random failures
	if rand.Float64() < s.failureRate {
		err := fmt.Errorf("payment gateway timeout")
		log.Printf("[WARN] Simulated failure: ExternalID=%s Error=%s", item.ExternalID, err)
		return err
	}

	log.Printf("[INFO] PIX payment succeeded: ExternalID=%s AmountCents=%d", item.ExternalID, item.AmountCents)
	return nil
}
