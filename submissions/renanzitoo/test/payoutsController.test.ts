import request from 'supertest';
import express from 'express';

// Mock handleBatch so controller tests are deterministic
jest.mock('../src/services/payoutsService', () => ({
  handleBatch: jest.fn(),
}));

import payoutsRouter from '../src/routes/payouts';
import { handleBatch } from '../src/services/payoutsService';

const mockHandleBatch = handleBatch as unknown as jest.Mock;

const app = express();
app.use(express.json());
app.use('/payouts', payoutsRouter);

describe('payouts controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('forwards empty body to handleBatch and returns 200 (no validation)', async () => {
    const resp = await request(app)
      .post('/payouts/batch')
      .send({});

    // controller currently forwards request body to handleBatch without validation
    expect(resp.status).toBe(200);
    expect(mockHandleBatch).toHaveBeenCalledWith({});
  });

  it('returns 200 and forwards handleBatch result', async () => {
    const mockResult = { batch_id: 'B1', processed: 1, successful: 1, failed: 0, duplicate: 0, details: [] };
  mockHandleBatch.mockResolvedValue(mockResult);

    const resp = await request(app)
      .post('/payouts/batch')
      .send({ batch_id: 'B1', items: [{ external_id: 'x1', user_id: 'u1', amount_cents: 1000, pix_key: 'a@a' }] });

    expect(resp.status).toBe(200);
    expect(resp.body).toMatchObject(mockResult);
  });

  it('returns 500 when handleBatch throws', async () => {
  mockHandleBatch.mockRejectedValue(new Error('boom'));

    const resp = await request(app)
      .post('/payouts/batch')
      .send({ batch_id: 'B1', items: [{ external_id: 'x1', user_id: 'u1', amount_cents: 1000, pix_key: 'a@a' }] });

    expect(resp.status).toBe(500);
  });
});
