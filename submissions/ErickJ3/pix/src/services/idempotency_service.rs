use anyhow::Result;
use redis::Client as RedisClient;

#[derive(Clone)]
pub struct IdempotencyService {
    redis: RedisClient,
}

impl IdempotencyService {
    pub fn new(redis_url: &str) -> Result<Self> {
        let redis = RedisClient::open(redis_url)?;
        Ok(Self { redis })
    }

    pub async fn check_and_lock(
        &self,
        idempotency_key: &str,
        ttl_seconds: usize,
    ) -> Result<bool> {
        let mut conn = self.redis.get_multiplexed_async_connection().await?;
        
        let lock_key = format!("idempotency:lock:{}", idempotency_key);
        let was_set: bool = redis::cmd("SET")
            .arg(&lock_key)
            .arg("locked")
            .arg("NX")
            .arg("EX")
            .arg(ttl_seconds)
            .query_async(&mut conn)
            .await?;
        
        Ok(was_set)
    }
    
    pub async fn get_result(&self, idempotency_key: &str) -> Result<Option<String>> {
        let mut conn = self.redis.get_multiplexed_async_connection().await?;
        let result_key = format!("idempotency:result:{}", idempotency_key);
        
        let result: Option<String> = redis::cmd("GET")
            .arg(&result_key)
            .query_async(&mut conn)
            .await?;
        
        Ok(result)
    }
    
    pub async fn store_result(
        &self,
        idempotency_key: &str,
        result: &str,
        ttl_seconds: usize,
    ) -> Result<()> {
        let mut conn = self.redis.get_multiplexed_async_connection().await?;
        let result_key = format!("idempotency:result:{}", idempotency_key);
        
        redis::cmd("SETEX")
            .arg(&result_key)
            .arg(ttl_seconds)
            .arg(result)
            .query_async::<String>(&mut conn)
            .await?;
        
        Ok(())
    }
}
