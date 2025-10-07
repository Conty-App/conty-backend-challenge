import { Creator } from "@prisma/client";
import { creatorService } from "./creator.service";
import { RecommendationRequestDto } from "../dtos";
import { calcAudienceFit, calcBudgetFit, calcPerformance, calcTagFit, getPenalties } from "../utils";

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