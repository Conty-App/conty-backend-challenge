import { creators as creatorsSchema, pastDeals as pastDealsSchema } from '../db/schema';
import { CampaignType } from '../types';

type CreatorType = typeof creatorsSchema.$inferSelect;
type PastDeal = typeof pastDealsSchema.$inferSelect;

interface IPerformanceStats {
  minViews: number;
  maxViews: number;
  minCtr: number;
  maxCtr: number;
}


// --- Tags Score (Jaccard Index)
export function calculateTagScore(campaignTags: string[], creatorTags: string[] | null): number {
  if (!creatorTags || creatorTags.length === 0) {
    return 0;
  }

  const campaignTagSet = new Set(campaignTags);
  const creatorTagSet = new Set(creatorTags);

  const intersection = new Set([...campaignTagSet].filter(tag => creatorTagSet.has(tag)));
  const union = new Set([...campaignTagSet, ...creatorTagSet]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}

// --- Audience Fit Score
export function calculateAudienceScore(campaign: CampaignType, creator: CreatorType): number {

  if (!creator.audienceLocation?.includes(campaign.audienceTarget.country)) {
    return 0; 
  }
  
  const [campaignMinAge, campaignMaxAge] = campaign.audienceTarget.ageRange;
  const creatorMinAge = creator.audienceAgeMin || 0;
  const creatorMaxAge = creator.audienceAgeMax || 0;

  const overlapStart = Math.max(campaignMinAge, creatorMinAge);
  const overlapEnd = Math.min(campaignMaxAge, creatorMaxAge);

  const overlap = Math.max(0, overlapEnd - overlapStart);
  const targetRangeSize = campaignMaxAge - campaignMinAge;

  if (targetRangeSize === 0) {
    return 0;
  }

  return overlap / targetRangeSize;
}

// --- Historical Performance Score
export function calculatePerformanceScore(creator: CreatorType, stats: IPerformanceStats): number {
  const normViews = (creator.avgViews! - stats.minViews) / (stats.maxViews - stats.minViews || 1);
  const normCtr = (creator.ctr! - stats.minCtr) / (stats.maxCtr - stats.minCtr || 1);
  
  return (normViews + normCtr) / 2;
}

// --- Budget Fit Score
export function calculateBudgetFitScore(campaign: CampaignType, creator: CreatorType): number {
  if (creator.priceMinCents! > campaign.budgetCents) {
    return 0;
  }
  return 1;
}

// --- Reliability Score
export function calculateReliabilityScore(creatorDeals: PastDeal[]): number {
  if (creatorDeals.length === 0) {
    return 0.75; // Default score for creators with no history
  }
  const onTimeCount = creatorDeals.filter(deal => deal.deliveredOnTime).length;
  return onTimeCount / creatorDeals.length;
}