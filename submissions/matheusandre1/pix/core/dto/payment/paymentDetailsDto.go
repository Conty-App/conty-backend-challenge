package payment

type PaymentDetailDto struct {
	ExternalID  string  `json:"external_id"`
	Status      string  `json:"status"`
	AmountCents float64 `json:"amount_cents"`
}
