import { Request, Response, NextFunction } from 'express';
import * as recommendationService from '../services/recommendation.service';

export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const { campaign, top_k } = req.body;
    if (!campaign) {
      return res.status(400).json({ message: 'Campaign object is required' });
    }

    const result = await recommendationService.findTopCreators(campaign, top_k);

    res.status(200).json(result);

  } catch (error) {
    next(error);
  }
}