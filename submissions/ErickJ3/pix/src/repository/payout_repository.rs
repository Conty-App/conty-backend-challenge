use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{BatchSummary, PayoutBatch, PayoutRecord, PayoutStatus};

#[derive(Clone)]
pub struct PayoutRepository {
    pub(crate) pool: PgPool,
}

impl PayoutRepository {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = PgPool::connect(database_url).await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }

    pub async fn insert_batch(&self, batch: &PayoutBatch) -> Result<Vec<Uuid>> {
        let mut tx = self.pool.begin().await?;
        let mut ids = Vec::new();

        for item in &batch.items {
            let idempotency_key = format!("{}:{}", batch.batch_id, item.external_id);

            let id: Uuid = sqlx::query_scalar(
                r#"
                INSERT INTO payouts (
                    id, batch_id, external_id, user_id, 
                    amount_cents, pix_key, status, 
                    idempotency_key, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                ON CONFLICT (idempotency_key) DO UPDATE 
                    SET idempotency_key = EXCLUDED.idempotency_key
                RETURNING id
                "#,
            )
            .bind(Uuid::new_v4())
            .bind(&batch.batch_id)
            .bind(&item.external_id)
            .bind(&item.user_id)
            .bind(item.amount_cents)
            .bind(&item.pix_key)
            .bind(PayoutStatus::Pending)
            .bind(&idempotency_key)
            .fetch_one(&mut *tx)
            .await?;

            ids.push(id);
        }

        tx.commit().await?;
        Ok(ids)
    }

    pub async fn update_status(&self, id: Uuid, status: PayoutStatus) -> Result<()> {
        sqlx::query("UPDATE payouts SET status = $1, updated_at = NOW() WHERE id = $2")
            .bind(status)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn list_by_batch(&self, batch_id: &str) -> Result<Vec<PayoutRecord>> {
        let records = sqlx::query_as::<_, PayoutRecord>(
            "SELECT * FROM payouts WHERE batch_id = $1 ORDER BY created_at",
        )
        .bind(batch_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(records)
    }

    pub async fn get_batch_with_summary(
        &self,
        batch_id: &str,
    ) -> Result<(Vec<PayoutRecord>, BatchSummary)> {
        let payouts = self.list_by_batch(batch_id).await?;

        let summary = sqlx::query_as::<_, (i64, i64, i64, i64, i64)>(
            r#"
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE status = 'processing') as processing,
                COUNT(*) FILTER (WHERE status = 'pending') as pending
            FROM payouts 
            WHERE batch_id = $1
            "#,
        )
        .bind(batch_id)
        .fetch_one(&self.pool)
        .await?;

        let batch_summary = BatchSummary {
            total: summary.0 as usize,
            completed: summary.1 as usize,
            failed: summary.2 as usize,
            processing: summary.3 as usize,
            pending: summary.4 as usize,
        };

        Ok((payouts, batch_summary))
    }
}
