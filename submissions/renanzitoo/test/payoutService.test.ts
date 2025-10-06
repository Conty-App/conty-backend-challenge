import { handleBatch } from '../src/services/payoutsService';

jest.mock('../src/utils/simulatePix', () => ({
  simulatePixPayment: jest.fn(),
}));

jest.mock('../src/models/db', () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { simulatePixPayment } from '../src/utils/simulatePix';
import { prisma as db } from '../src/models/db';

const simulate = simulatePixPayment as unknown as jest.Mock;

describe('handleBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeItem = (id: string) => ({
    external_id: id,
    user_id: `user-${id}`,
    amount_cents: 1000,
    pix_key: `${id}@example.com`,
  });

  it('processes all items successfully', async () => {
    const batch = { batch_id: 'B1', items: [makeItem('u1-001'), makeItem('u2-002')] };

  (db.payment.findUnique as unknown as jest.Mock).mockResolvedValue(null);
  (db.payment.create as unknown as jest.Mock).mockResolvedValue({});
  simulate.mockResolvedValue(true);

    const result = await handleBatch(batch);

    expect(result.processed).toBe(2);
    expect(result.successful).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.duplicate).toBe(0);
    expect(result.details.every(d => d.status === 'paid')).toBe(true);
    expect(db.payment.create).toHaveBeenCalledTimes(2);
  });

  it('skips duplicates and records duplicate details', async () => {
    const batch = { batch_id: 'B1', items: [makeItem('u1-001'), makeItem('u2-002')] };

    (db.payment.findUnique as unknown as jest.Mock).mockImplementation(({ where: { external_id } }: any) => {
      if (external_id === 'u1-001') return Promise.resolve({ external_id: 'u1-001' });
      return Promise.resolve(null);
    });
    (db.payment.create as unknown as jest.Mock).mockResolvedValue({});
    simulate.mockResolvedValue(true);

    const result = await handleBatch(batch);

    expect(result.processed).toBe(2);
    expect(result.duplicate).toBe(1);
    expect(result.successful).toBe(1);
    expect(result.details.find(d => d.external_id === 'u1-001')?.status).toBe('duplicate');
  });

  it('records failed payments', async () => {
    const batch = { batch_id: 'B1', items: [makeItem('u1-001')] };

  (db.payment.findUnique as unknown as jest.Mock).mockResolvedValue(null);
  (db.payment.create as unknown as jest.Mock).mockResolvedValue({});
    simulate.mockResolvedValue(false);

    const result = await handleBatch(batch);

    expect(result.processed).toBe(1);
    expect(result.successful).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.details[0].status).toBe('failed');
  });
});
