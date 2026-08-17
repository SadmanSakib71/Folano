import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "../controllers/categoryController";

const router = Router();

router.get("/", getAllCategories);
router.post("/", authenticate, requireAdmin, createCategory);
router.put("/:id", authenticate, requireAdmin, updateCategory);
router.delete("/:id", authenticate, requireAdmin, deleteCategory);

export default router;
