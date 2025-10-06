package domain

type Detail struct {
	ExternalID  string  `json:"external_id"`
	Status      string  `json:"status"`
	AmountCents float64 `json:"amount_cents"`
}
