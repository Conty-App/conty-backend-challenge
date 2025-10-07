import { recommendationController } from "../controllers/recommendation.controller";
import { FastifyTypedInstance } from "../types";

export async function routes(app: FastifyTypedInstance) {
    await recommendationController(app);
}