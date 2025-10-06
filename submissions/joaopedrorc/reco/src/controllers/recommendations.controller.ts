import { Request, Response, NextFunction } from 'express';
import * as recommendationService from '../services/recommendation.service';
import { RecommendationRequestType } from '../types';
import { mapCampaignPayloadToCampaign } from '../utils/mappers.utils';

export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const requestPayload: RecommendationRequestType = req.body;

    if (!requestPayload.campaign) {
      return res.status(400).json({ message: 'Campaign object is required' });
    }

    const campaign = mapCampaignPayloadToCampaign(requestPayload.campaign);
    const top_k = requestPayload.top_k;

    const result = await recommendationService.findTopCreators(campaign, top_k);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}