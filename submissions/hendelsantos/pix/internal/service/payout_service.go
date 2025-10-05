package service

import (
	"context"
	"sync"

	"github.com/hendelsantos/conty-pix-challenge/internal/domain"
	"github.com/sirupsen/logrus"
)

type payoutService struct {
	payoutRepo      domain.PayoutRepository
	batchReportRepo domain.BatchReportRepository
	pixProcessor    domain.PIXProcessor
	logger          *logrus.Logger
}

// NewPayoutService creates a new payout service
func NewPayoutService(
	payoutRepo domain.PayoutRepository,
	batchReportRepo domain.BatchReportRepository,
	pixProcessor domain.PIXProcessor,
	logger *logrus.Logger,
) domain.PayoutService {
	return &payoutService{
		payoutRepo:      payoutRepo,
		batchReportRepo: batchReportRepo,
		pixProcessor:    pixProcessor,
		logger:          logger,
	}
}

func (s *payoutService) ProcessBatch(ctx context.Context, request *domain.BatchRequest) (*domain.BatchResponse, error) {
	s.logger.WithFields(logrus.Fields{
		"batch_id":   request.BatchID,
		"item_count": len(request.Items),
	}).Info("Starting batch processing")

	// Initialize counters
	var processed, successful, failed, duplicates int
	var details []domain.PayoutDetail

	// Check for existing batch report
	existingReport, err := s.batchReportRepo.GetBatchReportByBatchID(ctx, request.BatchID)
	if err != nil {
		s.logger.WithError(err).Error("Failed to check existing batch report")
		return nil, err
	}

	// If batch already processed, return existing results
	if existingReport != nil {
		s.logger.WithField("batch_id", request.BatchID).Info("Batch already processed, returning existing results")
		
		payouts, err := s.payoutRepo.GetPayoutsByBatchID(ctx, request.BatchID)
		if err != nil {
			return nil, err
		}

		for _, payout := range payouts {
			details = append(details, domain.PayoutDetail{
				ExternalID:   payout.ExternalID,
				Status:       payout.Status,
				AmountCents:  payout.AmountCents,
				ErrorMessage: payout.ErrorMessage,
			})
		}

		return &domain.BatchResponse{
			BatchID:    existingReport.BatchID,
			Processed:  existingReport.Processed,
			Successful: existingReport.Successful,
			Failed:     existingReport.Failed,
			Duplicates: existingReport.Duplicates,
			Details:    details,
		}, nil
	}

	// Process each item
	var wg sync.WaitGroup
	results := make(chan domain.PayoutDetail, len(request.Items))
	
	for _, item := range request.Items {
		wg.Add(1)
		go func(item domain.PayoutItem) {
			defer wg.Done()
			detail := s.processItem(ctx, item, request.BatchID)
			results <- detail
		}(item)
	}

	// Wait for all goroutines to complete
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect results
	for detail := range results {
		details = append(details, detail)
		processed++
		
		switch detail.Status {
		case domain.StatusPaid:
			successful++
		case domain.StatusFailed:
			failed++
		case domain.StatusDuplicate:
			duplicates++
		}
	}

	// Create batch report
	report := &domain.BatchReport{
		BatchID:    request.BatchID,
		Processed:  processed,
		Successful: successful,
		Failed:     failed,
		Duplicates: duplicates,
	}

	if err := s.batchReportRepo.CreateBatchReport(ctx, report); err != nil {
		s.logger.WithError(err).Error("Failed to create batch report")
		return nil, err
	}

	s.logger.WithFields(logrus.Fields{
		"batch_id":   request.BatchID,
		"processed":  processed,
		"successful": successful,
		"failed":     failed,
		"duplicates": duplicates,
	}).Info("Batch processing completed")

	return &domain.BatchResponse{
		BatchID:    request.BatchID,
		Processed:  processed,
		Successful: successful,
		Failed:     failed,
		Duplicates: duplicates,
		Details:    details,
	}, nil
}

func (s *payoutService) processItem(ctx context.Context, item domain.PayoutItem, batchID string) domain.PayoutDetail {
	// Check if payout already exists (idempotency)
	exists, err := s.payoutRepo.ExistsPayoutByExternalID(ctx, item.ExternalID)
	if err != nil {
		s.logger.WithError(err).WithField("external_id", item.ExternalID).Error("Failed to check payout existence")
		errorMsg := "Failed to check payout existence"
		return domain.PayoutDetail{
			ExternalID:   item.ExternalID,
			Status:       domain.StatusFailed,
			AmountCents:  item.AmountCents,
			ErrorMessage: &errorMsg,
		}
	}

	if exists {
		s.logger.WithField("external_id", item.ExternalID).Info("Payout already exists, skipping")
		return domain.PayoutDetail{
			ExternalID:  item.ExternalID,
			Status:      domain.StatusDuplicate,
			AmountCents: item.AmountCents,
		}
	}

	// Create payout record
	payout := &domain.Payout{
		ExternalID:  item.ExternalID,
		UserID:      item.UserID,
		AmountCents: item.AmountCents,
		PIXKey:      item.PIXKey,
		Status:      domain.StatusPending,
		BatchID:     batchID,
	}

	if err := s.payoutRepo.CreatePayout(ctx, payout); err != nil {
		s.logger.WithError(err).WithField("external_id", item.ExternalID).Error("Failed to create payout")
		errorMsg := "Failed to create payout record"
		return domain.PayoutDetail{
			ExternalID:   item.ExternalID,
			Status:       domain.StatusFailed,
			AmountCents:  item.AmountCents,
			ErrorMessage: &errorMsg,
		}
	}

	// Process payment
	if err := s.ProcessSinglePayout(ctx, payout); err != nil {
		errMsg := err.Error()
		return domain.PayoutDetail{
			ExternalID:   item.ExternalID,
			Status:       domain.StatusFailed,
			AmountCents:  item.AmountCents,
			ErrorMessage: &errMsg,
		}
	}

	return domain.PayoutDetail{
		ExternalID:  item.ExternalID,
		Status:      domain.StatusPaid,
		AmountCents: item.AmountCents,
	}
}

func (s *payoutService) ProcessSinglePayout(ctx context.Context, payout *domain.Payout) error {
	// Process with PIX processor
	err := s.pixProcessor.ProcessPayment(ctx, payout)
	
	var status domain.PayoutStatus
	var errorMessage *string
	
	if err != nil {
		status = domain.StatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
		s.logger.WithError(err).WithField("external_id", payout.ExternalID).Error("PIX payment failed")
	} else {
		status = domain.StatusPaid
		s.logger.WithField("external_id", payout.ExternalID).Info("PIX payment successful")
	}

	// Update payout status
	updateErr := s.payoutRepo.UpdatePayoutStatus(ctx, payout.ID.String(), status, errorMessage)
	if updateErr != nil {
		s.logger.WithError(updateErr).WithField("external_id", payout.ExternalID).Error("Failed to update payout status")
		return updateErr
	}

	return err
}