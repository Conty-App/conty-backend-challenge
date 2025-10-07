import { z } from "zod";

export const RecommendationResponseDto = z.object({
    recommendations: z.array(
        z.object({
            creator_id: z.string(),
            score: z.number().min(0),
            fit_breakdown: z.object({
                tags: z.number().min(0).min(0),
                audience_overlap: z.number().min(0),
                performance: z.number().min(0),
                budget_fit: z.number().min(0)
            }),
            why: z.string(),
        })
    ), 
    metadata: z.object({
        total_creators: z.number().min(0),
        scoring_version: z.number().min(0)
    }),
})

export type RecommendationResponseDto = z.infer<typeof RecommendationResponseDto>;