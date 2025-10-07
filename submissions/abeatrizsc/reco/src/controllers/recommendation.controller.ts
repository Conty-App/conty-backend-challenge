import { RecommendationRequestDto, RecommendationResponseDto } from "../dtos";
import { RECOMMENDATION_BASE_URL } from "../routes/routes";
import { recommendationService } from "../services/recommendation.service";
import { FastifyTypedInstance } from "../types";
import { errors } from "../exceptions";

export async function recommendationController(app: FastifyTypedInstance) {
    app.post(RECOMMENDATION_BASE_URL, {
        schema: {
            tags: ['recommendations'],
            description: 'Given a campaign (briefing, budget, requirements) and a creator base (tags, stats, history), return a proper creator ranking with readable justifications.',
            body: RecommendationRequestDto,
            response: {
                200: RecommendationResponseDto,
                ...errors
            }  
        }
    }, async (request, reply) => {
        console.log(`Received PUT ${RECOMMENDATION_BASE_URL} - body: `, request.body);
        
        try {
            const recommendedCreators = await recommendationService.getRecommendedCreators(request.body);
    
            return reply.status(200).send(recommendedCreators);
        } catch(error:any) {
            console.error("[ERROR] Recommendation controller:", error);

            if (error.name === "ValidationError") {
                return reply.status(400).send({
                    statusCode: 400,
                    error: "Bad Request",
                    message: error.message,
                });
            }

            return reply.status(500).send({
                statusCode: 500,
                error: "Internal Server Error",
                message: "An unexpected error occurred.",
            });
        }
    })
}