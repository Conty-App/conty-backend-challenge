package entity

type PaymentItem struct {
	ExternalID  string `json:"external_id"`
	UserID      string `json:"user_id"`
	AmountCents int64  `json:"amount_cents"`
	PixKey      string `json:"pix_key"`
}

type BatchRequest struct {
	BatchID string        `json:"batch_id"`
	Items   []PaymentItem `json:"items"`
}

type PaymentDetail struct {
	ExternalID  string `json:"external_id"`
	Status      string `json:"status"`
	AmountCents int64  `json:"amount_cents"`
	Error       string `json:"error,omitempty"`
}

type BatchResponse struct {
	BatchID    string          `json:"batch_id"`
	Processed  int             `json:"processed"`
	Successful int             `json:"successful"`
	Failed     int             `json:"failed"`
	Duplicates int             `json:"duplicates"`
	Details    []PaymentDetail `json:"details"`
}
