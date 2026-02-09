export interface PayoutItem {
  external_id: string;
  user_id: string;
  amount_cents: number;
  pix_key: string;
}

export interface BatchInput {
  batch_id: string;
  items: PayoutItem[];
}

export type PaymentStatus = "paid" | "failed" | "duplicate";

export interface PaymentResult {
  external_id: string;
  status: PaymentStatus;
  amount_cents: number;
  retries: number;
}

export interface BatchReport {
  batch_id: string;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  details: PaymentResult[];
}
