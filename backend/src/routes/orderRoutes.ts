import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {
  createOrder,
  createPreorder,
  getMyOrders,
  getOrderById,
} from "../controllers/orderController";

const router = Router();

router.post("/", authenticate, createOrder);
router.post("/preorder", authenticate, createPreorder);
router.get("/my", authenticate, getMyOrders);
router.get("/:id", authenticate, getOrderById);

export default router;
