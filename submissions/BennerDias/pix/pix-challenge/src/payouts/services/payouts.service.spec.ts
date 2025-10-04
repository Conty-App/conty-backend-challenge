import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayoutsService } from './payouts.service';
import { Payout } from '../entities/payouts.entity';
import { CreateBatchDto } from '../dto/create-batch.dto';

jest.setTimeout(10000);

describe('PayoutsService', () => {
  let service: PayoutsService;
  let mockRepo: Partial<Repository<Payout>>;

  const mockBatchDto: CreateBatchDto = {
    batch_id: 'test-batch-001',
    items: [
      {
        external_id: 'u1-001',
        user_id: 'u1',
        amount_cents: 35000,
        pix_key: 'u1@email.com',
      },
      {
        external_id: 'u2-002',
        user_id: 'u2',
        amount_cents: 120000,
        pix_key: '+55 11 91234-5678',
      },
    ],
  };

  const mockSavedPayout = {
    external_id: 'u1-001',
    batch_id: 'test-batch-001',
    user_id: 'u1',
    amount_cents: 35000,
    pix_key: 'u1@email.com',
    status: 'PAID',
  } as Payout;

  const mockExistingPayout = { ...mockSavedPayout, status: 'PAID' } as Payout;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        {
          provide: getRepositoryToken(Payout),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processBatch', () => {
    it('should process a batch successfully (all new items, all paid)', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockRepo.create as jest.Mock).mockReturnValue(mockSavedPayout);
      (mockRepo.save as jest.Mock).mockResolvedValue(mockSavedPayout);
      jest
        .spyOn(service as any, 'simulatePixPayment')
        .mockResolvedValue({ success: true });

      const result = await service.processBatch(mockBatchDto);

      expect(mockRepo.findOne).toHaveBeenCalledTimes(2);
      expect(mockRepo.create).toHaveBeenCalledTimes(2);
      expect(mockRepo.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        batch_id: 'test-batch-001',
        processed: 2,
        successful: 2,
        failed: 0,
        duplicates: 0,
        details: [
          { external_id: 'u1-001', status: 'PAID', amount_cents: 35000 },
          { external_id: 'u2-002', status: 'PAID', amount_cents: 120000 },
        ],
      });
    });

    it('should handle duplicates (items already processed)', async () => {
      (mockRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(mockExistingPayout)
        .mockResolvedValueOnce(null);

      (mockRepo.create as jest.Mock).mockReturnValue(mockSavedPayout);
      (mockRepo.save as jest.Mock).mockResolvedValue(mockSavedPayout);
      jest
        .spyOn(service as any, 'simulatePixPayment')
        .mockResolvedValue({ success: true });

      const result = await service.processBatch(mockBatchDto);

      expect(result.duplicates).toBe(1);
      expect(result.successful).toBe(1);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(result.details[0].status).toBe('DUPLICATE');
      expect(result.details[1].status).toBe('PAID');
    });

    it('should handle failed payments (simulation fails)', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);
      const failedPayout = { ...mockSavedPayout, status: 'FAILED' };
      (mockRepo.create as jest.Mock).mockReturnValue(failedPayout);
      (mockRepo.save as jest.Mock).mockResolvedValue(failedPayout);
      jest
        .spyOn(service as any, 'simulatePixPayment')
        .mockResolvedValue({ success: false });

      const result = await service.processBatch({
        ...mockBatchDto,
        items: [mockBatchDto.items[0]],
      });

      expect(result.failed).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.details[0].status).toBe('FAILED');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should handle DB conflict (duplicate via unique constraint)', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockRepo.create as jest.Mock).mockReturnValue(mockSavedPayout);

      const dbError = Object.create(Error.prototype, {
        name: { value: 'QueryFailedError' },
        code: { value: 'ER_DUP_ENTRY' },
        message: { value: 'Duplicate entry' },
      });
      (mockRepo.save as jest.Mock).mockRejectedValue(dbError);

      const result = await service.processBatch({
        ...mockBatchDto,
        items: [mockBatchDto.items[0]],
      });

      expect(result.duplicates).toBe(1);
      expect(result.details[0].status).toBe('DUPLICATE');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    }, 10000);

    it('should process empty batch (no items)', async () => {
      const emptyDto: CreateBatchDto = { batch_id: 'empty', items: [] };
      const result = await service.processBatch(emptyDto);

      expect(result.processed).toBe(0);
      expect(result.details).toEqual([]);
    });
  });
});
