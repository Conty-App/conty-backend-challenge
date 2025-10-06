import { db } from '../db';
import { creators as creatorsSchema } from '../db/schema';
import {
  calculateTagScore,
  calculateAudienceScore,
  calculatePerformanceScore,
  calculateBudgetFitScore,
  calculateReliabilityScore,
} from '../utils/scoring.utils';

import { CampaignType } from '../types';

type CreatorType = typeof creatorsSchema.$inferSelect;

interface IPerformanceStats {
  minViews: number;
  maxViews: number;
  minCtr: number;
  maxCtr: number;
}

export async function calculateScore(creator: CreatorType, campaign: CampaignType, stats: IPerformanceStats) {
  const creatorDeals = await db.query.pastDeals.findMany({
    where: (deals, { eq }) => eq(deals.creatorId, creator.id),
  });

  const weights = {
    tags: 0.35,
    audience: 0.25,
    performance: 0.15,
    budget: 0.15,
    reliability: 0.10,
  };

  const scores = {
    tags: calculateTagScore(campaign.tagsRequired, creator.tags),
    audience: calculateAudienceScore(campaign, creator),
    performance: calculatePerformanceScore(creator, stats),
    budget: calculateBudgetFitScore(campaign, creator),
    reliability: calculateReliabilityScore(creatorDeals),
  };

  const finalScore =
    scores.tags * weights.tags +
    scores.audience * weights.audience +
    scores.performance * weights.performance +
    scores.budget * weights.budget +
    scores.reliability * weights.reliability;

  return {
    finalScore,
    breakdown: scores,
  };
}