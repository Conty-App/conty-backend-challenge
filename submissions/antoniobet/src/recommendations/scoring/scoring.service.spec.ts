import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringService],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute scores', () => {
    const creators = [
      {
        id: '1',
        name: 'Test Creator',
        tags: ['tech', 'fintech'],
        audienceCountry: 'BR',
        audienceAgeMin: 18,
        audienceAgeMax: 35,
        avgViews: 100000,
        ctr: 2.5,
        cvr: 1.2,
        priceMinCents: 100000,
        priceMaxCents: 500000,
        reliabilityScore: 8.5,
      },
    ];

    const campaign = {
      goal: 'awareness',
      tags_required: ['tech'],
      audience_target: {
        country: 'BR',
        age_range: [18, 35] as [number, number],
      },
      budget_cents: 1000000,
      deadline: new Date(),
    };

    const result = service.computeScores(creators, campaign);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('creator');
    expect(result[0]).toHaveProperty('score');
    expect(result[0]).toHaveProperty('breakdown');
  });
});
