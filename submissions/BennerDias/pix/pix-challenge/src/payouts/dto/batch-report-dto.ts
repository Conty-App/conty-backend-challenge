export class PayoutDetailDto {
  external_id: string;
  status: 'PAID' | 'FAILED' | 'DUPLICATE';
  amount_cents: number;
}

export class BatchReportDto {
  batch_id: string;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  details: PayoutDetailDto[];
}
