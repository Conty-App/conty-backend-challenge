CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE payouts (
    id UUID PRIMARY KEY,
    batch_id VARCHAR(255) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    pix_key VARCHAR(255) NOT NULL,
    status payout_status NOT NULL DEFAULT 'pending',
    idempotency_key VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_batch_id ON payouts(batch_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_created_at ON payouts(created_at);
CREATE UNIQUE INDEX idx_payouts_idempotency_key ON payouts(idempotency_key);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payouts_updated_at 
    BEFORE UPDATE ON payouts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();