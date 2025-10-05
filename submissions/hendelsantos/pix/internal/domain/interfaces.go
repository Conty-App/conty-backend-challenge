package domain

import "context"

// PayoutRepository defines the interface for payout data access
type PayoutRepository interface {
	// CreatePayout creates a new payout record
	CreatePayout(ctx context.Context, payout *Payout) error
	
	// GetPayoutByExternalID retrieves a payout by its external ID
	GetPayoutByExternalID(ctx context.Context, externalID string) (*Payout, error)
	
	// UpdatePayoutStatus updates the status of a payout
	UpdatePayoutStatus(ctx context.Context, id string, status PayoutStatus, errorMessage *string) error
	
	// GetPayoutsByBatchID retrieves all payouts for a given batch ID
	GetPayoutsByBatchID(ctx context.Context, batchID string) ([]Payout, error)
	
	// ExistsPayoutByExternalID checks if a payout with the given external ID exists
	ExistsPayoutByExternalID(ctx context.Context, externalID string) (bool, error)
}

// BatchReportRepository defines the interface for batch report data access
type BatchReportRepository interface {
	// CreateBatchReport creates a new batch report
	CreateBatchReport(ctx context.Context, report *BatchReport) error
	
	// UpdateBatchReport updates an existing batch report
	UpdateBatchReport(ctx context.Context, report *BatchReport) error
	
	// GetBatchReportByBatchID retrieves a batch report by batch ID
	GetBatchReportByBatchID(ctx context.Context, batchID string) (*BatchReport, error)
}

// PayoutService defines the interface for payout business logic
type PayoutService interface {
	// ProcessBatch processes a batch of payouts
	ProcessBatch(ctx context.Context, request *BatchRequest) (*BatchResponse, error)
	
	// ProcessSinglePayout processes a single payout (used internally)
	ProcessSinglePayout(ctx context.Context, payout *Payout) error
}

// PIXProcessor defines the interface for PIX payment processing
type PIXProcessor interface {
	// ProcessPayment simulates PIX payment processing
	ProcessPayment(ctx context.Context, payout *Payout) error
}