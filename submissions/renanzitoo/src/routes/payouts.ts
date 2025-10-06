import {Router} from 'express'
import {processBatch} from '../controllers/payoutsController'

const router = Router();

router.post('/batch', processBatch);

export default router;