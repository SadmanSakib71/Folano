import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatchStatus,
} from "../controllers/preorderBatchController";

const router = Router();

router.get("/", getAllBatches);
router.get("/:id", getBatchById);
router.post("/", authenticate, requireAdmin, createBatch);
router.patch("/:id/status", authenticate, requireAdmin, updateBatchStatus);

export default router;
