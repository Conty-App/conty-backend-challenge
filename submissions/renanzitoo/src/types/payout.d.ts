export interface PayoutItem {
  external_id: string;
  user_id: string;
  amount_cents: number;
  pix_key: string;
}

export interface PayoutBatch {
  batch_id: string;
  items: PayoutItem[];
}

export interface PayoutResult {
  external_id: string;
  status: 'paid' | 'failed' | 'duplicate';
  amount_cents: number;
}

export interface BatchReport {
  batch_id: string;
  processed: number;
  successful: number;
  failed: number;
  duplicate: number;
  details: PayoutResult[];
}