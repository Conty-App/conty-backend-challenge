package service

import (
	"fmt"
	"math/rand"
	"time"

	"RoyMusthang/internal/entity"
)

type PIXService struct {
	failureRate float64
}

func NewPIXService(failureRate float64) *PIXService {
	return &PIXService{failureRate: failureRate}
}

func (s *PIXService) ProcessPayment(item entity.PaymentItem) error {
	// Simulate network delay
	delay := time.Duration(50+rand.Intn(200)) * time.Millisecond
	time.Sleep(delay)

	// Validate basic business rules
	if item.AmountCents <= 0 {
		return fmt.Errorf("invalid amount: must be positive")
	}
	if item.PixKey == "" {
		return fmt.Errorf("pix_key is required")
	}

	// Simulate random failures
	if rand.Float64() < s.failureRate {
		return fmt.Errorf("payment gateway timeout")
	}

	return nil
}
