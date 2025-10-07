import { prisma } from "../lib/prisma"

export const creatorRepository = {
    async findAllByBudgetRange(campaignBudget: number) {
        return prisma.creator.findMany({
            where: {
                price_min: { lte: campaignBudget }
            }
        })
    }
}