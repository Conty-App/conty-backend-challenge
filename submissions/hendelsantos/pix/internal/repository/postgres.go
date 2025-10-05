package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/hendelsantos/conty-pix-challenge/internal/domain"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type postgresPayoutRepository struct {
	db *sql.DB
}

// NewPostgresPayoutRepository creates a new PostgreSQL payout repository
func NewPostgresPayoutRepository(db *sql.DB) domain.PayoutRepository {
	return &postgresPayoutRepository{db: db}
}

func (r *postgresPayoutRepository) CreatePayout(ctx context.Context, payout *domain.Payout) error {
	query := `
		INSERT INTO payouts (id, external_id, user_id, amount_cents, pix_key, status, batch_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	
	now := time.Now()
	payout.ID = uuid.New()
	payout.CreatedAt = now
	payout.UpdatedAt = now
	
	_, err := r.db.ExecContext(ctx, query,
		payout.ID,
		payout.ExternalID,
		payout.UserID,
		payout.AmountCents,
		payout.PIXKey,
		payout.Status,
		payout.BatchID,
		payout.CreatedAt,
		payout.UpdatedAt,
	)
	
	return err
}

func (r *postgresPayoutRepository) GetPayoutByExternalID(ctx context.Context, externalID string) (*domain.Payout, error) {
	query := `
		SELECT id, external_id, user_id, amount_cents, pix_key, status, batch_id, 
		       error_message, created_at, updated_at, processed_at
		FROM payouts
		WHERE external_id = $1
	`
	
	payout := &domain.Payout{}
	var errorMessage sql.NullString
	var processedAt sql.NullTime
	
	err := r.db.QueryRowContext(ctx, query, externalID).Scan(
		&payout.ID,
		&payout.ExternalID,
		&payout.UserID,
		&payout.AmountCents,
		&payout.PIXKey,
		&payout.Status,
		&payout.BatchID,
		&errorMessage,
		&payout.CreatedAt,
		&payout.UpdatedAt,
		&processedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	
	if errorMessage.Valid {
		payout.ErrorMessage = &errorMessage.String
	}
	
	if processedAt.Valid {
		payout.ProcessedAt = &processedAt.Time
	}
	
	return payout, nil
}

func (r *postgresPayoutRepository) UpdatePayoutStatus(ctx context.Context, id string, status domain.PayoutStatus, errorMessage *string) error {
	query := `
		UPDATE payouts 
		SET status = $1, error_message = $2, updated_at = $3, processed_at = $4
		WHERE id = $5
	`
	
	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, status, errorMessage, now, now, id)
	return err
}

func (r *postgresPayoutRepository) GetPayoutsByBatchID(ctx context.Context, batchID string) ([]domain.Payout, error) {
	query := `
		SELECT id, external_id, user_id, amount_cents, pix_key, status, batch_id,
		       error_message, created_at, updated_at, processed_at
		FROM payouts
		WHERE batch_id = $1
		ORDER BY created_at ASC
	`
	
	rows, err := r.db.QueryContext(ctx, query, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var payouts []domain.Payout
	for rows.Next() {
		var payout domain.Payout
		var errorMessage sql.NullString
		var processedAt sql.NullTime
		
		err := rows.Scan(
			&payout.ID,
			&payout.ExternalID,
			&payout.UserID,
			&payout.AmountCents,
			&payout.PIXKey,
			&payout.Status,
			&payout.BatchID,
			&errorMessage,
			&payout.CreatedAt,
			&payout.UpdatedAt,
			&processedAt,
		)
		if err != nil {
			return nil, err
		}
		
		if errorMessage.Valid {
			payout.ErrorMessage = &errorMessage.String
		}
		
		if processedAt.Valid {
			payout.ProcessedAt = &processedAt.Time
		}
		
		payouts = append(payouts, payout)
	}
	
	return payouts, rows.Err()
}

func (r *postgresPayoutRepository) ExistsPayoutByExternalID(ctx context.Context, externalID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM payouts WHERE external_id = $1)`
	
	var exists bool
	err := r.db.QueryRowContext(ctx, query, externalID).Scan(&exists)
	if err != nil {
		return false, err
	}
	
	return exists, nil
}

type postgresBatchReportRepository struct {
	db *sql.DB
}

// NewPostgresBatchReportRepository creates a new PostgreSQL batch report repository
func NewPostgresBatchReportRepository(db *sql.DB) domain.BatchReportRepository {
	return &postgresBatchReportRepository{db: db}
}

func (r *postgresBatchReportRepository) CreateBatchReport(ctx context.Context, report *domain.BatchReport) error {
	query := `
		INSERT INTO batch_reports (id, batch_id, processed, successful, failed, duplicates, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	
	now := time.Now()
	report.ID = uuid.New()
	report.CreatedAt = now
	report.UpdatedAt = now
	
	_, err := r.db.ExecContext(ctx, query,
		report.ID,
		report.BatchID,
		report.Processed,
		report.Successful,
		report.Failed,
		report.Duplicates,
		report.CreatedAt,
		report.UpdatedAt,
	)
	
	return err
}

func (r *postgresBatchReportRepository) UpdateBatchReport(ctx context.Context, report *domain.BatchReport) error {
	query := `
		UPDATE batch_reports 
		SET processed = $1, successful = $2, failed = $3, duplicates = $4, updated_at = $5
		WHERE batch_id = $6
	`
	
	report.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, query,
		report.Processed,
		report.Successful,
		report.Failed,
		report.Duplicates,
		report.UpdatedAt,
		report.BatchID,
	)
	
	return err
}

func (r *postgresBatchReportRepository) GetBatchReportByBatchID(ctx context.Context, batchID string) (*domain.BatchReport, error) {
	query := `
		SELECT id, batch_id, processed, successful, failed, duplicates, created_at, updated_at
		FROM batch_reports
		WHERE batch_id = $1
	`
	
	report := &domain.BatchReport{}
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(
		&report.ID,
		&report.BatchID,
		&report.Processed,
		&report.Successful,
		&report.Failed,
		&report.Duplicates,
		&report.CreatedAt,
		&report.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	
	return report, nil
}