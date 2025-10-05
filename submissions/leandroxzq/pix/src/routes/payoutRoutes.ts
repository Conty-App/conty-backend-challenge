import { Router } from "express";
import { payBatch } from "../controllers/payoutController.js";

const router = Router();

router.post("/batch", payBatch);

export default router;
