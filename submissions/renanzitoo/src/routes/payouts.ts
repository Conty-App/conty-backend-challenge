import {Router} from 'express'
import {getAllPayouts, getPayoutById, processBatch} from '../controllers/payoutsController'

const router = Router();

router.post('/batch', processBatch);
router.get('/:external_id', getPayoutById);
router.get('/', getAllPayouts);

export default router;