#[cfg(test)]
mod payout_repository_test {
    use crate::models::{PayoutBatch, PayoutItem, PayoutStatus};

    #[test]
    fn test_payout_item_serialization() {
        let item = PayoutItem {
            external_id: "ext-001".to_string(),
            user_id: "user-001".to_string(),
            amount_cents: 10000,
            pix_key: "test@example.com".to_string(),
        };

        let json = serde_json::to_string(&item).unwrap();
        let deserialized: PayoutItem = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.external_id, "ext-001");
        assert_eq!(deserialized.amount_cents, 10000);
    }

    #[test]
    fn test_payout_batch_serialization() {
        let batch = PayoutBatch {
            batch_id: "batch-001".to_string(),
            items: vec![PayoutItem {
                external_id: "ext-001".to_string(),
                user_id: "user-001".to_string(),
                amount_cents: 10000,
                pix_key: "test@example.com".to_string(),
            }],
        };

        let json = serde_json::to_string(&batch).unwrap();
        let deserialized: PayoutBatch = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.batch_id, "batch-001");
        assert_eq!(deserialized.items.len(), 1);
    }

    #[test]
    fn test_idempotency_key_format() {
        let batch_id = "batch-123";
        let external_id = "ext-456";
        let key = format!("{}:{}", batch_id, external_id);

        assert_eq!(key, "batch-123:ext-456");
    }

    #[test]
    fn test_payout_status_variants() {
        use serde_json::json;

        let pending = json!(PayoutStatus::Pending);
        let processing = json!(PayoutStatus::Processing);
        let completed = json!(PayoutStatus::Completed);
        let failed = json!(PayoutStatus::Failed);

        assert_eq!(pending.as_str().unwrap(), "Pending");
        assert_eq!(processing.as_str().unwrap(), "Processing");
        assert_eq!(completed.as_str().unwrap(), "Completed");
        assert_eq!(failed.as_str().unwrap(), "Failed");
    }
}
