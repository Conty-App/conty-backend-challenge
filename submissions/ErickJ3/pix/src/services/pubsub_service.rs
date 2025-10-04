use anyhow::Result;
use redis::Client as RedisClient;
use uuid::Uuid;

#[derive(Clone)]
pub struct PubSubService {
    pub(crate) redis: RedisClient,
}

impl PubSubService {
    pub fn new(redis_url: &str) -> Result<Self> {
        let redis = RedisClient::open(redis_url)?;
        Ok(Self { redis })
    }

    pub async fn publish_payout_event(&self, payout_id: Uuid, event_type: &str) -> Result<()> {
        let mut conn = self.redis.get_multiplexed_async_connection().await?;

        let event = serde_json::json!({
            "payout_id": payout_id.to_string(),
            "event_type": event_type,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        redis::cmd("XADD")
            .arg("payout_events")
            .arg("*")
            .arg("data")
            .arg(event.to_string())
            .query_async::<String>(&mut conn)
            .await?;

        Ok(())
    }
}
