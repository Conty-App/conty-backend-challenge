use crate::{
    repository::payout_repository::PayoutRepository,
    services::{idempotency_service::IdempotencyService, pubsub_service::PubSubService},
};

pub struct AppState {
    pub idempotency: IdempotencyService,
    pub repository: PayoutRepository,
    pub pubsub: PubSubService,
}