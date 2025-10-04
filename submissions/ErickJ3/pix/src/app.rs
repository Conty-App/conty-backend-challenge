use anyhow::Result;
use axum::{routing::post, Router};
use std::sync::Arc;
use tokio::task::JoinHandle;
use tracing::{error, info};

use crate::{
    api::handlers,
    config::Config,
    repository::payout_repository::PayoutRepository,
    services::{idempotency_service::IdempotencyService, pubsub_service::PubSubService},
    state::AppState,
    workers::payout_worker,
};

pub struct Application {
    pub http_server: JoinHandle<Result<()>>,
    pub workers: Vec<JoinHandle<Result<()>>>,
}

impl Application {
    pub async fn build(config: &Config) -> Result<Self> {
        let state = Arc::new(AppState {
            idempotency: IdempotencyService::new(&config.redis_uri)?,
            repository: PayoutRepository::new(&config.database_uri).await?,
            pubsub: PubSubService::new(&config.redis_uri)?,
        });

        let http_state = state.clone();
        let http_addr = config.http_addr.clone();
        let http_server = tokio::spawn(async move { run_http_server(http_state, http_addr).await });

        let mut workers = Vec::new();
        for i in 0..config.worker_count {
            let worker_state = state.clone();
            let worker_name = format!("worker-{}", i);

            let worker =
                tokio::spawn(async move { payout_worker::run(worker_state, worker_name).await });

            workers.push(worker);
        }

        Ok(Self {
            http_server,
            workers,
        })
    }

    pub async fn run_until_stopped(self) -> Result<()> {
        tokio::select! {
            result = self.http_server => {
                match result {
                    Ok(Ok(())) => info!("HTTP server stopped gracefully"),
                    Ok(Err(e)) => {
                        error!("HTTP server error: {:?}", e);
                        return Err(e);
                    }
                    Err(e) => {
                        error!("HTTP server panicked: {:?}", e);
                        return Err(anyhow::anyhow!("HTTP server panicked: {:?}", e));
                    }
                }
            }
            _ = async {
                for (i, worker) in self.workers.into_iter().enumerate() {
                    match worker.await {
                        Ok(Ok(())) => info!("Worker {} stopped gracefully", i),
                        Ok(Err(e)) => error!("Worker {} error: {:?}", i, e),
                        Err(e) => error!("Worker {} panicked: {:?}", i, e),
                    }
                }
            } => {}
        }

        Ok(())
    }
}

async fn run_http_server(state: Arc<AppState>, addr: String) -> Result<()> {
    let app = Router::new()
        .route("/batches", post(handlers::receive_batch))
        .route(
            "/batches/{batch_id}",
            axum::routing::get(handlers::get_batch_status),
        )
        .with_state(state);

    info!("Starting HTTP server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
