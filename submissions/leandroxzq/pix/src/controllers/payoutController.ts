import { Request, Response } from "express";
import {
  getAllBatches,
  processBatchPayment,
} from "../service/payoutService.js";

export async function getBatches(req: Request, res: Response) {
  try {
    const result = await getAllBatches();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar batches" });
  }
}

export async function payBatch(req: Request, res: Response) {
  const { batch_id, items } = req.body;

  if (batch_id === undefined || items === undefined) {
    return res.status(400).json({ error: "batch_id e items são obrigatórios" });
  }

  if (items.length === 0) {
    return res
      .status(400)
      .json({ error: "A lista de items não pode estar vazia" });
  }

  try {
    const result = await processBatchPayment(batch_id, items);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar pagamentos" });
  }
}
