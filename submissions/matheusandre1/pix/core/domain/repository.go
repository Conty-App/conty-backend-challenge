package domain

import "errors"

var ErrDuplicateExternalID = errors.New("external_id already exists")

type PaymentRepository interface {
	SavePayment(payment *Payment) error
	FindAllPayments() ([]*Payment, error)
	CheckDuplicate(externalID string) bool
	SavePaymentIfNotDuplicate(payment *Payment) error
}
