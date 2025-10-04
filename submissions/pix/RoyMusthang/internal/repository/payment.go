package repository

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"RoyMusthang/internal/entity"
)

type PaymentRepository struct {
	db *sql.DB
}

func NewPaymentRepository(db *sql.DB) *PaymentRepository {
	log.Println("[INFO] PaymentRepository initialized")
	return &PaymentRepository{
		db: db,
	}
}

func (r *PaymentRepository) IsProcessed(externalID string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM payments WHERE external_id = $1)`

	err := r.db.QueryRowContext(ctx, query, externalID).Scan(&exists)
	if err != nil {
		log.Printf("[ERROR] Failed to check if payment exists: ExternalID=%s Error=%v", externalID, err)
		return false
	}

	log.Printf("[DEBUG] Payment exists check: ExternalID=%s Exists=%v", externalID, exists)
	return exists
}

func (r *PaymentRepository) Save(p entity.Payment) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
        INSERT INTO payments (
            external_id, user_id, amount_cents, pix_key, status, error, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (external_id) 
        DO UPDATE SET 
            status = EXCLUDED.status,
            error = EXCLUDED.error,
            updated_at = EXCLUDED.updated_at
    `

	_, err := r.db.ExecContext(ctx, query,
		p.ExternalID,
		p.UserID,
		p.AmountCents,
		p.PixKey,
		p.Status,
		p.Error,
	)
	if err != nil {
		log.Printf("[ERROR] Failed to save payment: ExternalID=%s Status=%s Error=%v", p.ExternalID, p.Status, err)
		return err
	}

	log.Printf("[INFO] Payment saved: ExternalID=%s Status=%s AmountCents=%d", p.ExternalID, p.Status, p.AmountCents)
	return nil
}

func (r *PaymentRepository) Get(externalID string) (entity.PaymentDetail, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var detail entity.PaymentDetail
	var errorStr sql.NullString

	query := `
        SELECT external_id, status, amount_cents, error 
        FROM payments 
        WHERE external_id = $1
    `

	err := r.db.QueryRowContext(ctx, query, externalID).Scan(
		&detail.ExternalID,
		&detail.Status,
		&detail.AmountCents,
		&errorStr,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("[WARN] Payment not found: ExternalID=%s", externalID)
			return entity.PaymentDetail{}, false
		}
		log.Printf("[ERROR] Failed to get payment: ExternalID=%s Error=%v", externalID, err)
		return entity.PaymentDetail{}, false
	}

	if errorStr.Valid {
		detail.Error = errorStr.String
	}

	log.Printf("[DEBUG] Payment retrieved: ExternalID=%s Status=%s AmountCents=%d Error=%s",
		detail.ExternalID, detail.Status, detail.AmountCents, detail.Error)

	return detail, true
}
