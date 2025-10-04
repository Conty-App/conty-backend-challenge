package service

import (
	"log"
	"sync"

	"RoyMusthang/internal/entity"
	"RoyMusthang/internal/repository"
)

type PaymentService struct {
	repo       *repository.PaymentRepository
	pixService *PIXService
}

func NewPaymentService(repo *repository.PaymentRepository, pixService *PIXService) *PaymentService {
	return &PaymentService{
		repo:       repo,
		pixService: pixService,
	}
}

func (s *PaymentService) ProcessBatch(req entity.BatchRequest) entity.BatchResponse {
	log.Printf("[INFO] Starting batch processing: BatchID=%s, Items=%d", req.BatchID, len(req.Items))

	response := entity.BatchResponse{
		BatchID: req.BatchID,
		Details: make([]entity.PaymentDetail, 0, len(req.Items)),
	}

	var wg sync.WaitGroup
	resultsChan := make(chan entity.PaymentDetail, len(req.Items))

	for _, item := range req.Items {
		wg.Add(1)
		go func(item entity.PaymentItem) {
			defer wg.Done()
			detail := s.processItem(item)
			resultsChan <- detail
		}(item)
	}

	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	for detail := range resultsChan {
		response.Details = append(response.Details, detail)
		response.Processed++

		switch detail.Status {
		case "paid":
			response.Successful++
		case "failed":
			response.Failed++
		case "duplicate":
			response.Duplicates++
		}

		log.Printf("[INFO] Processed item: ExternalID=%s Status=%s AmountCents=%d Error=%s",
			detail.ExternalID, detail.Status, detail.AmountCents, detail.Error)
	}

	log.Printf("[INFO] Batch completed: BatchID=%s Processed=%d Success=%d Failed=%d Duplicates=%d",
		response.BatchID, response.Processed, response.Successful, response.Failed, response.Duplicates)

	return response
}

func (s *PaymentService) processItem(item entity.PaymentItem) entity.PaymentDetail {
	log.Printf("[DEBUG] Processing item: ExternalID=%s UserID=%s AmountCents=%d PixKey=%s",
		item.ExternalID, item.UserID, item.AmountCents, item.PixKey)

	if s.repo.IsProcessed(item.ExternalID) {
		log.Printf("[WARN] Duplicate detected: ExternalID=%s", item.ExternalID)
		existing, _ := s.repo.Get(item.ExternalID)
		return existing
	}

	err := s.pixService.ProcessPayment(item)

	payment := entity.Payment{
		ExternalID:  item.ExternalID,
		UserID:      item.UserID,
		AmountCents: item.AmountCents,
		PixKey:      item.PixKey,
	}

	if err != nil {
		payment.Status = "failed"
		payment.Error = err.Error()
		log.Printf("[ERROR] Payment failed: ExternalID=%s Error=%s", payment.ExternalID, payment.Error)
	} else {
		payment.Status = "paid"
		log.Printf("[INFO] Payment succeeded: ExternalID=%s AmountCents=%d", payment.ExternalID, payment.AmountCents)
	}

	_ = s.repo.Save(payment)

	return entity.PaymentDetail{
		ExternalID:  payment.ExternalID,
		Status:      payment.Status,
		AmountCents: payment.AmountCents,
		Error:       payment.Error,
	}
}
