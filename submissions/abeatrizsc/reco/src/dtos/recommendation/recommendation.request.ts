import { z } from "zod";

export const RecommendationRequestDto = z.object({
    campaign: z.object({
        goal: z.string().min(1, { message: "Goal cannot be empty" }),
        tags_required: z.array(z.string().min(1, { message: "Tag cannot be empty" })).nonempty({ message: "At least one tag is required" }),
        audience_target: z.object({
            country: z.string().min(2, { message: "Invalid country" }),
            age_range: z.array(z.number().min(0).max(100)).min(2).max(2).nonempty({ message: "Age range is required"}),
        }),
        budget_cents: z.number().min(0, { message: "Budget must be positive" }),
        deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date",
        })
    }),
    top_k: z.number().min(1).default(10),
    diversity: z.boolean().default(true)
})

export type RecommendationRequestDto = z.infer<typeof RecommendationRequestDto>;