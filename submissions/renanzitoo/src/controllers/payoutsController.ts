import {Request, Response} from 'express';
import { handleBatch } from '../services/payoutsService';
import { PayoutBatch } from '../types/payout';

export async function processBatch(req: Request, res: Response): Promise<void> {
  try {
    const batchData = req.body as PayoutBatch;
    const result = await handleBatch(batchData);
    res.json(result);
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}