use anyhow::Result;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{error, info, warn};

use crate::{
    models::{PayoutEvent, PayoutStatus},
    state::AppState,
};

pub async fn run(state: Arc<AppState>, worker_name: String) -> Result<()> {
    info!("Starting worker: {}", worker_name);

    let consumer_group = "payout_processors";

    let mut conn = state
        .pubsub
        .redis
        .get_multiplexed_async_connection()
        .await?;
    let _: Result<(), redis::RedisError> = redis::cmd("XGROUP")
        .arg("CREATE")
        .arg("payout_events")
        .arg(consumer_group)
        .arg("0")
        .arg("MKSTREAM")
        .query_async(&mut conn)
        .await;

    loop {
        match process_batch(&state, consumer_group, &worker_name).await {
            Ok(0) => sleep(Duration::from_millis(100)).await,
            Ok(_) => {}
            Err(e) => {
                error!("Worker {} error: {:?}", worker_name, e);
                sleep(Duration::from_secs(5)).await;
            }
        }
    }
}

async fn process_batch(
    state: &AppState,
    consumer_group: &str,
    consumer_name: &str,
) -> Result<usize> {
    let mut conn = state
        .pubsub
        .redis
        .get_multiplexed_async_connection()
        .await?;

    let results: redis::streams::StreamReadReply = redis::cmd("XREADGROUP")
        .arg("GROUP")
        .arg(consumer_group)
        .arg(consumer_name)
        .arg("COUNT")
        .arg(10)
        .arg("BLOCK")
        .arg(5000)
        .arg("STREAMS")
        .arg("payout_events")
        .arg(">")
        .query_async(&mut conn)
        .await?;

    let mut processed = 0;

    for stream_key in results.keys {
        for stream_id in stream_key.ids {
            if let Some(event_str) = extract_string_from_value(stream_id.map.get("data")) {
                match serde_json::from_str::<PayoutEvent>(&event_str) {
                    Ok(event) => {
                        if let Err(e) = process_payout_event(state, &event).await {
                            error!("Failed to process event {:?}: {:?}", event, e);
                            continue;
                        }

                        let _: () = redis::cmd("XACK")
                            .arg("payout_events")
                            .arg(consumer_group)
                            .arg(&stream_id.id)
                            .query_async(&mut conn)
                            .await?;

                        processed += 1;
                    }
                    Err(e) => warn!("Invalid event format: {:?}", e),
                }
            }
        }
    }

    Ok(processed)
}

async fn process_payout_event(state: &AppState, event: &PayoutEvent) -> Result<()> {
    let payout_id = event.payout_id;
    info!("Processing payout: {}", payout_id);

    let idempotency_key = format!("process:{}:{}", payout_id, event.event_type);

    if !state
        .idempotency
        .check_and_lock(&idempotency_key, 300)
        .await?
    {
        info!("Payout {} already processed, skipping", payout_id);
        return Ok(());
    }

    state
        .repository
        .update_status(payout_id, PayoutStatus::Processing)
        .await?;

    sleep(Duration::from_millis(500)).await;

    state
        .repository
        .update_status(payout_id, PayoutStatus::Completed)
        .await?;
    info!("Payout {} completed successfully", payout_id);

    Ok(())
}

fn extract_string_from_value(value: Option<&redis::Value>) -> Option<String> {
    match value? {
        redis::Value::BulkString(bytes) => Some(String::from_utf8_lossy(bytes).to_string()),
        redis::Value::SimpleString(s) => Some(s.clone()),
        _ => None,
    }
}
