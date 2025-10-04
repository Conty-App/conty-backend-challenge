use anyhow::Result;
use tracing::info;

mod api;
mod app;
mod config;
mod models;
mod repository;
mod services;
mod state;
mod workers;
mod model_test;

use crate::{app::Application, config::Config};

#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_target(false)
        .compact()
        .init();

    let config = Config::from_env()?;

    let app = Application::build(&config).await?;

    info!("Application started");

    app.run_until_stopped().await?;

    Ok(())
}