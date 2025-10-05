import { FastifyInstance } from "fastify";
import { PayoutService } from "../services/payoutService";
import { payoutBatchSchema } from "../schemas/payoutSchemas";

const payoutService = new PayoutService();
export default async function (app: FastifyInstance) {
  app.post("/batch", async (req, reply) => {
    const parseResult = payoutBatchSchema.safeParse(req.body);

    if (!parseResult.success) {
      return reply.code(400).send({ error: parseResult.error.message });
    }

    const { batch_id, items } = parseResult.data;

    const result = await payoutService.processBatch(batch_id, items);

    return reply.code(200).send(result);
  });
}
