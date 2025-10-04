use anyhow::Result;

#[derive(Clone)]
pub struct Config {
    pub database_uri: String,
    pub redis_uri: String,
    pub http_addr: String,
    pub worker_count: i8,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            database_uri: std::env::var("DATABASE_URL")?,
            redis_uri: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://127.0.0.1:6767".to_string()),
            http_addr: std::env::var("HTTP_ADDR").unwrap_or_else(|_| "0.0.0.0:3000".to_string()),
            worker_count: std::env::var("WORKER_COUNT")
                .unwrap_or_else(|_| "4".to_string())
                .parse()?,
        })
    }
}
