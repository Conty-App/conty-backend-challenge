import { Creator } from "@prisma/client";
import { creatorService } from "./creator.service";
import { RecommendationRequestDto } from "../dtos";

export const recommendationService = {
    getRecommendedCreators: async ({ campaign, top_k } : RecommendationRequestDto) => {
        console.log("[INFO] recommendationService - getRecommendedCreators() started.");

        const creators: Creator[] = await creatorService.getCreatorsByBudgetRange(campaign.budget_cents);

        const recommendedCreators = creators.map((creator) => {
            const { tagFit, reason: tagReason } = calcTagFit(campaign.tags_required, creator.tags);

            const { audienceFit, reason: audienceReason } = calcAudienceFit(campaign.audience_target, { audience_location: creator.audience_location, audience_age: creator.audience_age });

            const performance = calcPerformance(creators, creator.ctr, creator.cvr, creator.avg_views);
            
            const budgetFit = calcBudgetFit(campaign.budget_cents, creator.price_max, creator.price_min);

            const weights = {
                tags: 0.30,
                audience_overlap: 0.30,
                performance: 0.25,
                budget_fit: 0.15
            };

            const { penaltie, reason: reliabilityReason } = getPenalties(creator.reliability_score);

            const score = ((tagFit * weights.tags +
                audienceFit * weights.audience_overlap +
                performance * weights.performance +
                budgetFit * weights.budget_fit) - 
                penaltie
            ).toFixed(2);
            const reasons = [tagReason, audienceReason, reliabilityReason];

            return {
                creator_id: creator.id,
                score: Number(score),
                fit_breakdown: {
                    tags: tagFit,
                    audience_overlap: audienceFit,
                    performance: performance,
                    budget_fit: budgetFit
                },
                why: reasons.filter(Boolean).join('; '),
            };
        })

        recommendedCreators.sort((a, b) => b.score - a.score);
        return { 
            recommendations: recommendedCreators.slice(0, top_k),
            metadata: {
                total_creators: creators.length,
                scoring_version: 1.0
            }
        };
    }
}

function calcTagFit(tagsRequired: string[], tags: string[]) {
    const campaignTags = new Set<any>(tagsRequired);
    const creatorTags = new Set<any>(tags);

    const intersection = new Set<any>();
    for (const item of campaignTags) {
        if (creatorTags.has(item)) {
            intersection.add(item);
        }
    }

    const union = new Set<any>([...campaignTags, ...creatorTags]);
    const tagFit = union.size === 0 ? 0 : intersection.size / union.size;

    const reason = intersection.size > 0
    ? `Fala sobre ${[...intersection].join(', ')}`
    : '';

    return { tagFit: Number(tagFit.toFixed(2)), reason };
}

function calcAudienceFit(
    campaign: { country: string; age_range: number[] }, 
    creator: { audience_location: string[], audience_age: number[] }
) {
    const hasCampaignCountry = creator.audience_location.includes(campaign.country);

    const countryFit = hasCampaignCountry ? 1 : 0;
    const countryFitPercentage = hasCampaignCountry ? (1 / creator.audience_location.length) * 100 : 0;

    const [campaignMinAge, campaignMaxAge] = campaign.age_range;
    const [creatorMinAge, creatorMaxAge] = creator.audience_age;

    const minAgeOverlap = Math.max(creatorMinAge, campaignMinAge);
    const maxAgeOverlap = Math.min(creatorMaxAge, campaignMaxAge);
    const ageOverlap =  maxAgeOverlap - minAgeOverlap;

    const ageFit = ageOverlap > 0 ? ageOverlap / (campaignMaxAge - campaignMinAge) : 0;

    const audienceOverlap = countryFit * 0.5 + ageFit * 0.5; 

    let reason: string = "";
    if (countryFit > 0) reason += `${countryFitPercentage}% audiência ${campaign.country}`;
    if (ageOverlap > 0 && countryFit > 0) reason += (` ${minAgeOverlap}–${maxAgeOverlap}`);

    return { audienceFit: Number(audienceOverlap.toFixed(2)), reason };
}

function calcPerformance(
    creators: Creator[], 
    ctr: number, 
    cvr: number, 
    avgViews: number
) : number {
  const maxViews = Math.max(...creators.map(c => c.avg_views));
  const maxCtr = Math.max(...creators.map(c => c.ctr));
  const maxCvr = Math.max(...creators.map(c => c.cvr));

  const viewsScore = avgViews / maxViews;
  const ctrScore = ctr / maxCtr;
  const cvrScore = cvr / maxCvr;

  const performance = (viewsScore * 0.4) + (ctrScore * 0.3) + (cvrScore * 0.3);

  return Number(performance.toFixed(2));
}

function calcBudgetFit(
    campaignBudget: number, 
    creatorMinPrice: number, 
    creatorMaxPrice: number
) : number {
    if (campaignBudget >= creatorMaxPrice) {
        return 1;
    }

    const totalBudgetRange = creatorMaxPrice - creatorMinPrice;
    if (totalBudgetRange <= 0) return 0;

    return Number(((campaignBudget - creatorMinPrice) / totalBudgetRange).toFixed(2));
}

function getPenalties(reliability_score: number) {
    let penaltie = 0.00;
    let reason = "";

    if (reliability_score < 0.75) {
        penaltie = 0.20;
    } else {
        reason = `Alta confiabilidade (${reliability_score}% de entregas pontuais)`
    }
  return  { penaltie, reason };
}
