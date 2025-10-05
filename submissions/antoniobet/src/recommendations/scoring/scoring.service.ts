import { Injectable } from '@nestjs/common';
import {
  jaccard,
  ageOverlapRatio,
  minMaxNormalize,
  clamp,
} from './normalization.util';

type PastDeal = {
  campaignId: string | null;
  campaignBrand?: string;
  deliveredOnTime: boolean;
  performanceScore: number;
  deliveredAt: Date;
};

type Creator = {
  id: string;
  name: string;
  tags: string[];
  audienceCountry: string;
  audienceAgeMin: number;
  audienceAgeMax: number;
  avgViews: number;
  ctr: number;
  cvr: number;
  priceMinCents: number;
  priceMaxCents: number;
  reliabilityScore: number;
  pastDeals?: PastDeal[];
};

type CampaignInput = {
  brand?: string;
  goal: string;
  tags_required: string[];
  audience_target: { country: string; age_range: [number, number] };
  budget_cents: number;
  deadline: Date;
};

@Injectable()
export class ScoringService {
  private weights = {
    tags: 0.3,
    audience: 0.2,
    performance: 0.18,
    budget: 0.1,
    reliability: 0.12,
    penalty: 0.1,
  };

  computeScores(creators: Creator[], campaign: CampaignInput) {
    const views = creators.map((c) => c.avgViews);
    const ctrs = creators.map((c) => c.ctr);
    const cvrs = creators.map((c) => c.cvr);
    const minViews = Math.min(...views);
    const maxViews = Math.max(...views);
    const minCtr = Math.min(...ctrs);
    const maxCtr = Math.max(...ctrs);
    const minCvr = Math.min(...cvrs);
    const maxCvr = Math.max(...cvrs);

    const tagSaturation = this.calculateTagSaturation(creators);

    const results = creators.map((c) => {
      const tagsScore = jaccard(campaign.tags_required, c.tags);

      const countryMatch =
        campaign.audience_target.country.toLowerCase() ===
        c.audienceCountry.toLowerCase()
          ? 1
          : 0;
      const ageScore = ageOverlapRatio(
        [
          campaign.audience_target.age_range[0],
          campaign.audience_target.age_range[1],
        ],
        [c.audienceAgeMin, c.audienceAgeMax],
      );
      const audienceScore = 0.5 * countryMatch + 0.5 * ageScore;

      const viewsN = minMaxNormalize(c.avgViews, minViews, maxViews);
      const ctrN = minMaxNormalize(c.ctr, minCtr, maxCtr);
      const cvrN = minMaxNormalize(c.cvr, minCvr, maxCvr);
      const performanceScore = (viewsN + ctrN + cvrN) / 3;

      let budgetScore = 0;
      if (
        campaign.budget_cents >= c.priceMinCents &&
        campaign.budget_cents <= c.priceMaxCents
      ) {
        budgetScore = 1;
      } else if (campaign.budget_cents < c.priceMinCents) {
        const diff = c.priceMinCents - campaign.budget_cents;
        budgetScore = clamp(1 - diff / Math.max(1, c.priceMinCents));
      } else {
        budgetScore = 0.7;
      }

      const reliabilityScore = this.calculateReliability(c);
      const penaltyScore = this.calculatePenalties(c, campaign, tagSaturation);

      const score =
        this.weights.tags * tagsScore +
        this.weights.audience * audienceScore +
        this.weights.performance * performanceScore +
        this.weights.budget * budgetScore +
        this.weights.reliability * reliabilityScore -
        this.weights.penalty * penaltyScore;

      const breakdown = {
        tags: Number(tagsScore.toFixed(4)),
        audience: Number(audienceScore.toFixed(4)),
        performance: Number(performanceScore.toFixed(4)),
        budget: Number(budgetScore.toFixed(4)),
        reliability: Number(reliabilityScore.toFixed(4)),
        penalty: Number(penaltyScore.toFixed(4)),
      };

      return { creator: c, score: Number(score.toFixed(4)), breakdown };
    });

    return results.sort((a, b) => b.score - a.score);
  }

  private calculateReliability(creator: Creator): number {
    if (!creator.pastDeals || creator.pastDeals.length === 0) {
      return clamp(creator.reliabilityScore / 10);
    }

    const onTimeDeliveries = creator.pastDeals.filter(
      (d) => d.deliveredOnTime,
    ).length;
    const onTimeRate = onTimeDeliveries / creator.pastDeals.length;

    const historicalScore = onTimeRate;
    const baseScore = creator.reliabilityScore / 10;

    return clamp(0.6 * historicalScore + 0.4 * baseScore);
  }

  private calculatePenalties(
    creator: Creator,
    campaign: CampaignInput,
    tagSaturation: Map<string, number>,
  ): number {
    let penalty = 0;

    if (campaign.brand && creator.pastDeals) {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const recentCompetitorDeals = creator.pastDeals.filter((deal) => {
        return (
          deal.campaignBrand &&
          deal.campaignBrand !== campaign.brand &&
          deal.deliveredAt >= ninetyDaysAgo
        );
      });

      if (recentCompetitorDeals.length > 0) {
        penalty += Math.min(0.5, recentCompetitorDeals.length * 0.15);
      }
    }

    const creatorTagsKey = creator.tags.sort().join(',');
    const saturation = tagSaturation.get(creatorTagsKey) || 0;

    if (saturation > 0.1) {
      penalty += Math.min(0.3, (saturation - 0.1) * 2);
    }

    return clamp(penalty);
  }

  private calculateTagSaturation(creators: Creator[]): Map<string, number> {
    const tagCombinations = new Map<string, number>();
    const total = creators.length;

    creators.forEach((c) => {
      const key = c.tags.sort().join(',');
      tagCombinations.set(key, (tagCombinations.get(key) || 0) + 1);
    });

    const saturationMap = new Map<string, number>();
    tagCombinations.forEach((count, key) => {
      saturationMap.set(key, count / total);
    });

    return saturationMap;
  }
}
