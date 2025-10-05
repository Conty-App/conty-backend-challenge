package domain

import (
	"time"

	"github.com/google/uuid"
)

// PayoutStatus represents the status of a payout
type PayoutStatus string

const (
	StatusPending   PayoutStatus = "pending"
	StatusPaid      PayoutStatus = "paid"
	StatusFailed    PayoutStatus = "failed"
	StatusDuplicate PayoutStatus = "duplicate"
)

// Payout represents a single payout transaction
type Payout struct {
	ID           uuid.UUID    `json:"id" db:"id"`
	ExternalID   string       `json:"external_id" db:"external_id"`
	UserID       string       `json:"user_id" db:"user_id"`
	AmountCents  int64        `json:"amount_cents" db:"amount_cents"`
	PIXKey       string       `json:"pix_key" db:"pix_key"`
	Status       PayoutStatus `json:"status" db:"status"`
	BatchID      string       `json:"batch_id" db:"batch_id"`
	ErrorMessage *string      `json:"error_message,omitempty" db:"error_message"`
	CreatedAt    time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at" db:"updated_at"`
	ProcessedAt  *time.Time   `json:"processed_at,omitempty" db:"processed_at"`
}

// BatchRequest represents the request to process a batch of payouts
type BatchRequest struct {
	BatchID string        `json:"batch_id" binding:"required"`
	Items   []PayoutItem  `json:"items" binding:"required,min=1"`
}

// PayoutItem represents a single payout item in a batch request
type PayoutItem struct {
	ExternalID  string `json:"external_id" binding:"required"`
	UserID      string `json:"user_id" binding:"required"`
	AmountCents int64  `json:"amount_cents" binding:"required,min=1"`
	PIXKey      string `json:"pix_key" binding:"required"`
}

// BatchReport represents the summary of a batch processing
type BatchReport struct {
	ID         uuid.UUID `json:"id" db:"id"`
	BatchID    string    `json:"batch_id" db:"batch_id"`
	Processed  int       `json:"processed" db:"processed"`
	Successful int       `json:"successful" db:"successful"`
	Failed     int       `json:"failed" db:"failed"`
	Duplicates int       `json:"duplicates" db:"duplicates"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// BatchResponse represents the response of a batch processing
type BatchResponse struct {
	BatchID    string         `json:"batch_id"`
	Processed  int            `json:"processed"`
	Successful int            `json:"successful"`
	Failed     int            `json:"failed"`
	Duplicates int            `json:"duplicates"`
	Details    []PayoutDetail `json:"details"`
}

// PayoutDetail represents the detail of a processed payout
type PayoutDetail struct {
	ExternalID   string       `json:"external_id"`
	Status       PayoutStatus `json:"status"`
	AmountCents  int64        `json:"amount_cents"`
	ErrorMessage *string      `json:"error_message,omitempty"`
}