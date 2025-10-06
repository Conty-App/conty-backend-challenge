import e, {Request, Response} from 'express';
import { handleBatch } from '../services/payoutsService';
import { PayoutBatch } from '../types/payout';
import { getAllPayments, getPaymentById } from '../models/paymentStore';

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

export async function getAllPayouts(req: Request, res: Response): Promise<void> {
  try {
    const payouts = await getAllPayments();
    res.json({total: payouts.length, payouts});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getPayoutById(req: Request, res: Response): Promise<void> {
  const { external_id } = req.params;
  try{
    const payment = await getPaymentById(external_id);
    if(!payment){
      res.status(404).json({error: 'Payment not found'});
    }else{
      res.json(payment);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}