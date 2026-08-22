import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import { getAdminProducts } from "../controllers/productController";

const router = Router();

router.get("/", authenticate, requireAdmin, getAdminProducts);

export default router;
