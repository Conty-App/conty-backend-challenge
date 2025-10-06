package service

import (
	"errors"

	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/domain"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/payment"
	paymentDto "github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/payment"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/request"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/response"
)

type PaymentService struct {
	repository domain.PaymentRepository
}

func NewPaymentService(repository domain.PaymentRepository) *PaymentService {
	return &PaymentService{
		repository: repository,
	}
}

func (s *PaymentService) ProcessPaymentBatch(request request.PaymentRequestDto) (*response.PaymentResponseDto, error) {

	externalIDsInBatch := make(map[string]bool)
	for _, item := range request.Items {
		if externalIDsInBatch[item.ExternalID] {
			return nil, errors.New("duplicate external_id found within the same batch: " + item.ExternalID)
		}
		externalIDsInBatch[item.ExternalID] = true
	}

	response := &response.PaymentResponseDto{
		BatchID:    request.BatchID,
		Processed:  len(request.Items),
		Successful: 0,
		Failed:     0,
		Duplicates: 0,
		Details:    []payment.PaymentDetailDto{},
	}

	duplicateItems := []payment.PaymentDetailDto{}

	for _, item := range request.Items {
		isDuplicate := s.repository.CheckDuplicate(item.ExternalID)

		detail := payment.PaymentDetailDto{
			ExternalID:  item.ExternalID,
			AmountCents: item.AmountCents,
		}

		if isDuplicate {
			detail.Status = "duplicate"
			response.Duplicates++
			duplicateItems = append(duplicateItems, detail)
		} else {
			detail.Status = "paid"
			response.Successful++
			response.Details = append(response.Details, detail)
		}
	}

	response.Details = append(response.Details, duplicateItems...)

	if response.Successful > 0 {
		validPaymentDetails := []domain.Detail{}
		for _, detail := range response.Details {
			if detail.Status == "paid" {
				validPaymentDetails = append(validPaymentDetails, domain.Detail{
					ExternalID:  detail.ExternalID,
					Status:      detail.Status,
					AmountCents: detail.AmountCents,
				})
			}
		}

		payment := &domain.Payment{
			BatchID:    response.BatchID,
			Processed:  int64(response.Processed),
			Successful: int64(response.Successful),
			Failed:     int64(response.Failed),
			Duplicates: int64(response.Duplicates),
			Details:    validPaymentDetails,
		}

		err := s.repository.SavePaymentIfNotDuplicate(payment)
		if err != nil {
			if errors.Is(err, domain.ErrDuplicateExternalID) {
				return nil, errors.New("failed to save payment: duplicate external_id detected")
			}
			return nil, err
		}
	}

	if response.Duplicates == response.Processed {
		return nil, errors.New("all items in batch have duplicate external_id, batch not saved")
	}

	return response, nil
}

func (s *PaymentService) GetAllPayments() ([]*response.PaymentResponseDto, error) {
	payments, err := s.repository.FindAllPayments()
	if err != nil {
		return nil, err
	}

	responses := make([]*response.PaymentResponseDto, 0, len(payments))
	for _, payment := range payments {
		response := &response.PaymentResponseDto{
			BatchID:    payment.BatchID,
			Processed:  int(payment.Processed),
			Successful: int(payment.Successful),
			Failed:     int(payment.Failed),
			Duplicates: int(payment.Duplicates),
			Details:    []paymentDto.PaymentDetailDto{},
		}

		for _, detail := range payment.Details {
			response.Details = append(response.Details, paymentDto.PaymentDetailDto{
				ExternalID:  detail.ExternalID,
				Status:      detail.Status,
				AmountCents: detail.AmountCents,
			})
		}

		responses = append(responses, response)
	}

	return responses, nil
}
