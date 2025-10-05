import { Request, Response } from "express";
import { processBatchPayment } from "../service/payoutService.js";

export async function payBatch(req: Request, res: Response) {
  const { batch_id, items } = req.body;
  try {
    const result = await processBatchPayment(batch_id, items);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamentos" });
  }
}
