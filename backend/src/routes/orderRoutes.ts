import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import {
  createOrder,
  createPreorder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  submitPaymentClaim,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controllers/orderController";

const router = Router();

router.post("/", authenticate, createOrder);
router.post("/preorder", authenticate, createPreorder);
router.post("/payment-claim", authenticate, submitPaymentClaim);
router.get("/my", authenticate, getMyOrders);
router.get("/", authenticate, requireAdmin, getAllOrders);
router.patch("/:id/status", authenticate, requireAdmin, updateOrderStatus);
router.patch("/:id/payment-status", authenticate, requireAdmin, updatePaymentStatus);
router.get("/:id", authenticate, getOrderById);

export default router;
