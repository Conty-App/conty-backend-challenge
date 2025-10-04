package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"RoyMusthang/internal/entity"
)

type PaymentRepository struct {
	db *sql.DB
}

func NewPaymentRepository(db *sql.DB) *PaymentRepository {
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
		return false
	}

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
	return err
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
			return entity.PaymentDetail{}, false
		}
		return entity.PaymentDetail{}, false
	}

	if errorStr.Valid {
		detail.Error = errorStr.String
	}

	return detail, true
}
