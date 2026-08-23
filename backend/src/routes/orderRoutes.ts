import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware";
import {
  confirmPayment,
  createOrder,
  createPreorder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getPendingPaymentClaims,
  rejectPaymentClaim,
  submitPaymentClaim,
  updateOrderStatus,
  updatePaymentStatus,
} from "../controllers/orderController";

const router = Router();

router.post("/", authenticate, createOrder);
router.post("/preorder", authenticate, createPreorder);
router.post("/payment-claim", authenticate, submitPaymentClaim);
router.get("/my", authenticate, getMyOrders);
router.get("/pending-payments", authenticate, requireAdmin, getPendingPaymentClaims);
router.get("/", authenticate, requireAdmin, getAllOrders);
router.patch("/:id/status", authenticate, requireAdmin, updateOrderStatus);
router.patch("/:id/payment-status", authenticate, requireAdmin, updatePaymentStatus);
router.patch("/:id/confirm-payment", authenticate, requireAdmin, confirmPayment);
router.patch("/:id/reject-payment", authenticate, requireAdmin, rejectPaymentClaim);
router.get("/:id", authenticate, getOrderById);

export default router;
