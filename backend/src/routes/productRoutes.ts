import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/productController";

const router = Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", authenticate, requireAdmin, createProduct);
router.put("/:id", authenticate, requireAdmin, updateProduct);
router.delete("/:id", authenticate, requireAdmin, deleteProduct);

export default router;
