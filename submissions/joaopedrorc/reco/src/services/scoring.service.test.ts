import { vi, describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { calculateScore } from './scoring.service';
import * as scoringUtils from '../utils/scoring.utils';

vi.mock('../db');
vi.mock('../utils/scoring.utils');

// --- Test Data ---
const mockCreator = {
  id: 'creator1',
  name: 'Test Creator',
  tags: ['test'],
  audienceAgeMin: 18,
  audienceAgeMax: 25,
  audienceLocation: ['BR'],
  avgViews: 5000,
  ctr: 0.05,
  cvr: 0.02,
  priceMinCents: 5000,
  priceMaxCents: 10000,
  reliabilityScore: 0.9,
};

const mockCampaign = {
  tagsRequired: ['test'],
  audienceTarget: { country: 'BR', ageRange: [18, 25] as [number, number] },
  budgetCents: 100000,
  goal: 'brand awareness',
  deadline: '2099-12-31',
};

const mockPerformanceStats = {
  minViews: 0, maxViews: 10000, minCtr: 0, maxCtr: 0.1,
};

const mockPastDeals = [
  { id: 'deal1', creatorId: 'creator1', campaignId: 'campaign1', deliveredOnTime: true, performanceScore: 0.9 },
  { id: 'deal2', creatorId: 'creator1', campaignId: 'campaign2', deliveredOnTime: false, performanceScore: 0.7 },
];


describe('Scoring Service: calculateScore', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(db.query.pastDeals.findMany).mockResolvedValue(mockPastDeals);

    vi.mocked(scoringUtils.calculateTagScore).mockReturnValue(0.8);
    vi.mocked(scoringUtils.calculateAudienceScore).mockReturnValue(0.7);
    vi.mocked(scoringUtils.calculatePerformanceScore).mockReturnValue(0.6);
    vi.mocked(scoringUtils.calculateBudgetFitScore).mockReturnValue(1.0);
    vi.mocked(scoringUtils.calculateReliabilityScore).mockReturnValue(0.5);
  });

  it('should calculate the final score as a correct weighted average of all sub-scores', async () => {
    const { finalScore } = await calculateScore(mockCreator, mockCampaign, mockPerformanceStats);

    const expectedScore = (0.8 * 0.35) +
                          (0.7 * 0.25) +
                          (0.6 * 0.15) +
                          (1.0 * 0.15) +
                          (0.5 * 0.10); 
    
    expect(finalScore).toBeCloseTo(expectedScore);
  });

  it('should return a breakdown object with the correct sub-scores', async () => {
    const { breakdown } = await calculateScore(mockCreator, mockCampaign, mockPerformanceStats);

    expect(breakdown.tags).toBe(0.8);
    expect(breakdown.audience).toBe(0.7);
    expect(breakdown.performance).toBe(0.6);
    expect(breakdown.budget).toBe(1.0);
    expect(breakdown.reliability).toBe(0.5);
  });

  it('should fetch past deals specifically for the given creator', async () => {
    await calculateScore(mockCreator, mockCampaign, mockPerformanceStats);

    expect(db.query.pastDeals.findMany).toHaveBeenCalledWith({
      where: expect.any(Function),
    });
  });

  it('should pass the correct arguments to each utility function', async () => {
    await calculateScore(mockCreator, mockCampaign, mockPerformanceStats);
    
    expect(scoringUtils.calculateTagScore).toHaveBeenCalledWith(mockCampaign.tagsRequired, mockCreator.tags);
    expect(scoringUtils.calculateAudienceScore).toHaveBeenCalledWith(mockCampaign, mockCreator);
    expect(scoringUtils.calculatePerformanceScore).toHaveBeenCalledWith(mockCreator, mockPerformanceStats);
    expect(scoringUtils.calculateBudgetFitScore).toHaveBeenCalledWith(mockCampaign, mockCreator);
    expect(scoringUtils.calculateReliabilityScore).toHaveBeenCalledWith(mockPastDeals);
  });
});