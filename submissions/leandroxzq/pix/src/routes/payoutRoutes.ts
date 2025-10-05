import { Router } from "express";
import { payBatch, getBatches } from "../controllers/payoutController.js";

const router = Router();

router.post("/batch", payBatch);
router.get("/all", getBatches);

export default router;
