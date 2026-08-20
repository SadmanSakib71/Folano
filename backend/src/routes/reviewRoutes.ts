import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { createReview, getProductReviews } from "../controllers/reviewController";

const router = Router();

router.get("/products/:productId/reviews", getProductReviews);
router.post("/reviews", authenticate, createReview);

export default router;
