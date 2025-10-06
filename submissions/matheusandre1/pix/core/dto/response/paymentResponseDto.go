package response

import paymentDto "github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/payment"

type PaymentResponseDto struct {
	BatchID    string                        `json:"batch_id"`
	Processed  int                           `json:"processed"`
	Successful int                           `json:"successful"`
	Failed     int                           `json:"failed"`
	Duplicates int                           `json:"duplicates"`
	Details    []paymentDto.PaymentDetailDto `json:"details"`
}
