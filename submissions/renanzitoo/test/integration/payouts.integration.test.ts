const request = require('supertest');
const express = require('express');

jest.mock('../../src/utils/simulatePix', () => ({
  simulatePixPayment: jest.fn(),
}));

jest.mock('../../src/models/db', () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const payoutsRouter = require('../../src/routes/payouts').default;
const simulate = require('../../src/utils/simulatePix').simulatePixPayment;
const db = require('../../src/models/db').prisma;

const app = express();
app.use(express.json());
app.use('/payouts', payoutsRouter);

describe('integration /payouts/batch', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('processes a batch end-to-end (success paths)', async () => {
    db.payment.findUnique.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({});
    simulate.mockResolvedValue(true);

    const resp = await request(app)
      .post('/payouts/batch')
      .send({ batch_id: 'B1', items: [{ external_id: 'i1', user_id: 'u1', amount_cents: 500, pix_key: 'a@b' }] });

    expect(resp.status).toBe(200);
    expect(resp.body.processed).toBe(1);
    expect(resp.body.successful).toBe(1);
    expect(db.payment.create).toHaveBeenCalledTimes(1);
  });

  test('returns duplicate when payment exists', async () => {
    db.payment.findUnique.mockResolvedValue({ external_id: 'i1' });
    simulate.mockResolvedValue(true);

    const resp = await request(app)
      .post('/payouts/batch')
      .send({ batch_id: 'B1', items: [{ external_id: 'i1', user_id: 'u1', amount_cents: 500, pix_key: 'a@b' }] });

  expect(resp.status).toBe(200);
  expect(resp.body.duplicate).toBe(1);
    expect(db.payment.create).not.toHaveBeenCalled();
  });

  test('records failed payments', async () => {
    db.payment.findUnique.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({});
    simulate.mockResolvedValue(false);

    const resp = await request(app)
      .post('/payouts/batch')
      .send({ batch_id: 'B1', items: [{ external_id: 'i2', user_id: 'u2', amount_cents: 500, pix_key: 'a@b' }] });

    expect(resp.status).toBe(200);
    expect(resp.body.failed).toBe(1);
  });
});

