import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import { getAdminCategories } from "../controllers/categoryController";

const router = Router();

router.get("/", authenticate, requireAdmin, getAdminCategories);

export default router;
