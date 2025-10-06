package request

import "github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/payment"

type PaymentRequestDto struct {
	BatchID string                   `json:"batch_id"`
	Items   []payment.PaymentItemDto `json:"items"`
}
