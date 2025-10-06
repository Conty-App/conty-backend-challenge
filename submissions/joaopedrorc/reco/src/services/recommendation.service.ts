import { db } from '../db';
import { calculateScore } from './scoring.service';

import { CampaignType } from '../types';

export async function findTopCreators(campaign: CampaignType, top_k = 10) {
  const allCreators = await db.query.creators.findMany();

  // Pre-calculate stats for performance normalization
  const allViews = allCreators.map(c => c.avgViews || 0);
  const allCtrs = allCreators.map(c => c.ctr || 0);
  const performanceStats = {
      minViews: Math.min(...allViews),
      maxViews: Math.max(...allViews),
      minCtr: Math.min(...allCtrs),
      maxCtr: Math.max(...allCtrs),
  };

  const matchedCreators = await Promise.all(
    allCreators.map(async (creator) => {
      const { finalScore, breakdown } = await calculateScore(creator, campaign, performanceStats);

      const whyString = `Matches tags (${(breakdown.tags * 100).toFixed(0)}%). Reliability: ${(breakdown.reliability * 100).toFixed(0)}%.`;

      return {
        creator_id: creator.id,
        score: parseFloat(finalScore.toFixed(2)),
        fit_breakdown: {
          tags: parseFloat(breakdown.tags.toFixed(2)),
          audience_overlap: parseFloat(breakdown.audience.toFixed(2)),
          performance: parseFloat(breakdown.performance.toFixed(2)),
          budget_fit: parseFloat(breakdown.budget.toFixed(2)),
        },
        why: whyString,
      };
    })
  );

  const recommendations = matchedCreators
    .sort((a, b) => b.score - a.score)
    .slice(0, top_k);

  return {
    recommendations,
    metadata: {
      total_creators: allCreators.length,
      scoring_version: "1.0"
    }
  };
}