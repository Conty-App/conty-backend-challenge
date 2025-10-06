package database

import (
	"sync"

	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/domain"
)

type InMemoryPaymentRepository struct {
	payments map[string]*domain.Payment
	details  map[string]bool
	mutex    sync.RWMutex
}

func NewInMemoryPaymentRepository() *InMemoryPaymentRepository {
	return &InMemoryPaymentRepository{
		payments: make(map[string]*domain.Payment),
		details:  make(map[string]bool),
	}
}

func (r *InMemoryPaymentRepository) SavePaymentIfNotDuplicate(payment *domain.Payment) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	for _, detail := range payment.Details {
		if _, exists := r.details[detail.ExternalID]; exists {
			return domain.ErrDuplicateExternalID
		}
	}

	r.payments[payment.BatchID] = payment

	for _, detail := range payment.Details {
		r.details[detail.ExternalID] = true
	}

	return nil
}

func (r *InMemoryPaymentRepository) SavePayment(payment *domain.Payment) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	r.payments[payment.BatchID] = payment

	for _, detail := range payment.Details {
		r.details[detail.ExternalID] = true
	}

	return nil
}

func (r *InMemoryPaymentRepository) CheckDuplicate(externalID string) bool {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	_, exists := r.details[externalID]
	return exists
}

func (r *InMemoryPaymentRepository) FindAllPayments() ([]*domain.Payment, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	payments := make([]*domain.Payment, 0, len(r.payments))
	for _, payment := range r.payments {
		payments = append(payments, payment)
	}

	return payments, nil
}
