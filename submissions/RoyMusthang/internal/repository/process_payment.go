package repository

import (
	"sync"

	"RoyMusthang/internal/entity"
)

type PaymentRepository struct {
	mu        sync.RWMutex
	processed map[string]entity.PaymentDetail
}

func NewPaymentRepository() *PaymentRepository {
	return &PaymentRepository{
		processed: make(map[string]entity.PaymentDetail),
	}
}

func (r *PaymentRepository) IsProcessed(externalID string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.processed[externalID]
	return exists
}

func (r *PaymentRepository) Save(externalID string, detail entity.PaymentDetail) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.processed[externalID] = detail
}

func (r *PaymentRepository) Get(externalID string) (entity.PaymentDetail, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	detail, exists := r.processed[externalID]
	return detail, exists
}
