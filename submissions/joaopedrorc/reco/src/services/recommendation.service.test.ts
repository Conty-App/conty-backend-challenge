import { vi, describe, it, expect, beforeEach } from 'vitest';
import { findTopCreators } from './recommendation.service';
import { db } from '../db';
import { calculateScore } from './scoring.service';


vi.mock('../db');
vi.mock('./scoring.service');

const mockCreators = [
  {
    id: 'creator1',
    name: 'Creator One',
    tags: ['test'],
    audienceAgeMin: 18,
    audienceAgeMax: 25,
    audienceLocation: ['BR'],
    avgViews: 1000,
    ctr: 0.05,
    cvr: null,
    priceMinCents: null,
    priceMaxCents: null,
    reliabilityScore: null,
  },
  {
    id: 'creator2',
    name: 'Creator Two',
    tags: ['test'],
    audienceAgeMin: 18,
    audienceAgeMax: 25,
    audienceLocation: ['BR'],
    avgViews: 5000,
    ctr: 0.10,
    cvr: null,
    priceMinCents: null,
    priceMaxCents: null,
    reliabilityScore: null,
  },
  {
    id: 'creator3',
    name: 'Creator Three',
    tags: ['test'],
    audienceAgeMin: 18,
    audienceAgeMax: 25,
    audienceLocation: ['BR'],
    avgViews: 2000,
    ctr: 0.02,
    cvr: null,
    priceMinCents: null,
    priceMaxCents: null,
    reliabilityScore: null,
  },
];

const mockCampaign = {
  tagsRequired: ['test'],
  audienceTarget: { country: 'BR', ageRange: [18, 25] as [number, number] },
  budgetCents: 100000,
  goal: 'brand awareness',
  deadline: new Date('2099-12-31').toISOString(),
};

describe('Recommendation Service: findTopCreators', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.query.creators.findMany).mockResolvedValue(mockCreators );

    vi.mocked(calculateScore).mockImplementation(async (creator) => {
      const baseBreakdown = {
        tags: 0.1, audience: 0.1, performance: 0.1, budget: 0.1, reliability: 0.1,
      };

      if (creator.id === 'creator1') return { finalScore: 0.5, breakdown: baseBreakdown };
      if (creator.id === 'creator2') return { finalScore: 0.9, breakdown: baseBreakdown };
      if (creator.id === 'creator3') return { finalScore: 0.7, breakdown: baseBreakdown };
      
      return { finalScore: 0, breakdown: baseBreakdown };
    });
  });

  it('should return a list of creators sorted by score in descending order', async () => {
    const result = await findTopCreators(mockCampaign);

    expect(result.recommendations.length).toBe(3);
    expect(result.recommendations[0].creator_id).toBe('creator2');
    expect(result.recommendations[1].creator_id).toBe('creator3');
    expect(result.recommendations[2].creator_id).toBe('creator1');
    expect(result.recommendations[0].score).toBe(0.9);
  });

  it('should respect the top_k parameter', async () => {
    const top_k = 2;
    const result = await findTopCreators(mockCampaign, top_k);

    expect(result.recommendations.length).toBe(top_k);
    expect(result.recommendations[0].creator_id).toBe('creator2');
    expect(result.recommendations[1].creator_id).toBe('creator3');
  });

  it('should correctly calculate and return metadata', async () => {
    const result = await findTopCreators(mockCampaign);

    expect(result.metadata.total_creators).toBe(mockCreators.length);
    expect(result.metadata.scoring_version).toBe('1.0');
  });

  it('should call calculateScore for each creator', async () => {
    await findTopCreators(mockCampaign);


    expect(calculateScore).toHaveBeenCalledTimes(mockCreators.length);
    expect(calculateScore).toHaveBeenCalledWith(mockCreators[0], mockCampaign, expect.any(Object));
  });
});