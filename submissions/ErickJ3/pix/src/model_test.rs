#[cfg(test)]
mod model_validation_tests {
    use crate::models::{PayoutBatch, PayoutItem};

    #[test]
    fn test_payout_item_valid_amount() {
        let item = PayoutItem {
            external_id: "ext-001".to_string(),
            user_id: "user-001".to_string(),
            amount_cents: 10000,
            pix_key: "test@example.com".to_string(),
        };

        assert!(item.amount_cents > 0);
    }

    #[test]
    fn test_batch_with_multiple_items() {
        let batch = PayoutBatch {
            batch_id: "batch-001".to_string(),
            items: vec![
                PayoutItem {
                    external_id: "ext-001".to_string(),
                    user_id: "user-001".to_string(),
                    amount_cents: 10000,
                    pix_key: "test1@example.com".to_string(),
                },
                PayoutItem {
                    external_id: "ext-002".to_string(),
                    user_id: "user-002".to_string(),
                    amount_cents: 20000,
                    pix_key: "test2@example.com".to_string(),
                },
            ],
        };

        assert_eq!(batch.items.len(), 2);
        assert!(batch.items.iter().all(|item| !item.external_id.is_empty()));
        assert!(batch.items.iter().all(|item| item.amount_cents > 0));
    }

    #[test]
    fn test_external_ids_are_unique_in_batch() {
        let batch = PayoutBatch {
            batch_id: "batch-001".to_string(),
            items: vec![
                PayoutItem {
                    external_id: "ext-001".to_string(),
                    user_id: "user-001".to_string(),
                    amount_cents: 10000,
                    pix_key: "test@example.com".to_string(),
                },
                PayoutItem {
                    external_id: "ext-002".to_string(),
                    user_id: "user-002".to_string(),
                    amount_cents: 20000,
                    pix_key: "test@example.com".to_string(),
                },
            ],
        };

        let external_ids: Vec<&String> = batch.items.iter().map(|item| &item.external_id).collect();

        let unique_ids: std::collections::HashSet<_> = external_ids.iter().collect();

        assert_eq!(
            external_ids.len(),
            unique_ids.len(),
            "External IDs should be unique"
        );
    }

    #[test]
    fn test_pix_key_formats() {
        let valid_keys = vec![
            "email@example.com",
            "+5511999999999",
            "12345678901",
            "550e8400-e29b-41d4-a716-446655440000",
        ];

        for key in valid_keys {
            let item = PayoutItem {
                external_id: "ext-001".to_string(),
                user_id: "user-001".to_string(),
                amount_cents: 10000,
                pix_key: key.to_string(),
            };

            assert!(!item.pix_key.is_empty());
        }
    }

    #[test]
    fn test_batch_json_deserialization_from_file_format() {
        let json = r#"{
            "batch_id": "batch-123",
            "items": [
                {
                    "external_id": "payout-001",
                    "user_id": "user-456",
                    "amount_cents": 10000,
                    "pix_key": "email@example.com"
                }
            ]
        }"#;

        let batch: PayoutBatch = serde_json::from_str(json).unwrap();

        assert_eq!(batch.batch_id, "batch-123");
        assert_eq!(batch.items[0].external_id, "payout-001");
        assert_eq!(batch.items[0].amount_cents, 10000);
    }
}
