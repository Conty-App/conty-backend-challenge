import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendations.controller';

const router = Router();
router.post('/', getRecommendations);

export default router;