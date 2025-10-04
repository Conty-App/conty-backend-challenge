package service

import (
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
	}

	return response
}

func (s *PaymentService) processItem(item entity.PaymentItem) entity.PaymentDetail {
	if s.repo.IsProcessed(item.ExternalID) {
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
	} else {
		payment.Status = "paid"
	}

	_ = s.repo.Save(payment)

	return entity.PaymentDetail{
		ExternalID:  payment.ExternalID,
		Status:      payment.Status,
		AmountCents: payment.AmountCents,
		Error:       payment.Error,
	}
}
