import { Creator } from "@prisma/client";
import { creatorRepository } from "../repositories/creator.repository";

export const creatorService = {
    getCreatorsByBudgetRange: async (budget : number): Promise<Creator[]> => {
        return await creatorRepository.findAllByBudgetRange(budget);
    }
}