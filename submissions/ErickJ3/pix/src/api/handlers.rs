use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

use crate::{
    models::{BatchStatusResponse, PayoutBatch},
    state::AppState,
};

pub async fn receive_batch(
    State(state): State<Arc<AppState>>,
    Json(batch): Json<PayoutBatch>,
) -> Result<impl IntoResponse, AppError> {
    let idempotency_key = format!("batch:{}", batch.batch_id);

    if let Some(cached_result) = state.idempotency.get_result(&idempotency_key).await? {
        return Ok((
            StatusCode::OK,
            Json(serde_json::from_str::<serde_json::Value>(&cached_result)?),
        ));
    }

    if !state
        .idempotency
        .check_and_lock(&idempotency_key, 300)
        .await?
    {
        return Err(AppError::Conflict("Batch already processing".into()));
    }

    let ids = state.repository.insert_batch(&batch).await?;

    for id in &ids {
        state
            .pubsub
            .publish_payout_event(*id, "payout.created")
            .await?;
    }

    let response = serde_json::json!({
        "batch_id": batch.batch_id,
        "received_items": ids.len(),
        "payout_ids": ids,
    });

    state
        .idempotency
        .store_result(&idempotency_key, &response.to_string(), 86400)
        .await?;

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn get_batch_status(
    State(state): State<Arc<AppState>>,
    Path(batch_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let (payouts, summary) = state.repository.get_batch_with_summary(&batch_id).await?;

    Ok(Json(BatchStatusResponse {
        batch_id,
        payouts,
        summary,
    }))
}

#[derive(Debug)]
pub enum AppError {
    Internal(anyhow::Error),
    Conflict(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg),
            AppError::Internal(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };

        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Internal(e.into())
    }
}
