package payment

type PaymentItemDto struct {
	ExternalID  string  `json:"external_id"`
	UserID      string  `json:"user_id"`
	AmountCents float64 `json:"amount_cents"`
	PixKey      string  `json:"pix_key"`
}
