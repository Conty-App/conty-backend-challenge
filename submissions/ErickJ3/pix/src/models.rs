use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PayoutBatch {
    pub batch_id: String,
    pub items: Vec<PayoutItem>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PayoutEvent {
    pub payout_id: Uuid,
    pub event_type: String,
    pub timestamp: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PayoutItem {
    pub external_id: String,
    pub user_id: String,
    pub amount_cents: i64,
    pub pix_key: String,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PayoutRecord {
    pub id: Uuid,
    pub batch_id: String,
    pub external_id: String,
    pub user_id: String,
    pub amount_cents: i64,
    pub pix_key: String,
    pub status: PayoutStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub idempotency_key: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type, PartialEq)]
#[sqlx(type_name = "payout_status", rename_all = "lowercase")]
pub enum PayoutStatus {
    Pending,
    Processing,
    Completed,
    Failed,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct BatchSummary {
    pub total: usize,
    pub completed: usize,
    pub failed: usize,
    pub processing: usize,
    pub pending: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchStatusResponse {
    pub batch_id: String,
    pub payouts: Vec<PayoutRecord>,
    pub summary: BatchSummary,
}