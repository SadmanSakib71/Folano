import { Request, Response } from "express";
import db from "../config/database";

const VERIFIED_PURCHASE_ERROR =
  "শুধু ডেলিভার হওয়া অর্ডারের প্রোডাক্টে রিভিউ দেওয়া যায়";
const DUPLICATE_REVIEW_ERROR =
  "এই অর্ডারের এই প্রোডাক্টে আপনি ইতিমধ্যে রিভিউ দিয়েছেন";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = toFiniteNumber(value);

  if (parsed === null || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function getProductReviews(req: Request, res: Response) {
  try {
    const productId = parsePositiveInt(req.params.productId);

    if (productId === null) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await db("products").where({ id: productId }).first();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const reviews = await db("reviews")
      .join("users", "reviews.user_id", "users.id")
      .where("reviews.product_id", productId)
      .select(
        "reviews.id",
        "reviews.user_id",
        "reviews.product_id",
        "reviews.order_id",
        "reviews.rating",
        "reviews.comment",
        "reviews.created_at",
        "reviews.updated_at",
        "users.name as user_name"
      )
      .orderBy("reviews.created_at", "desc");

    const total_reviews = reviews.length;
    const average_rating =
      total_reviews === 0
        ? 0
        : Number(
            (
              reviews.reduce(
                (sum, review) => sum + Number(review.rating),
                0
              ) / total_reviews
            ).toFixed(2)
          );

    return res.status(200).json({
      reviews,
      average_rating,
      total_reviews,
    });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function createReview(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { product_id, order_id, rating, comment } = req.body;

    if (product_id === undefined || product_id === null || product_id === "") {
      return res.status(400).json({ error: "product_id is required" });
    }

    if (order_id === undefined || order_id === null || order_id === "") {
      return res.status(400).json({ error: "order_id is required" });
    }

    if (rating === undefined || rating === null || rating === "") {
      return res.status(400).json({ error: "rating is required" });
    }

    const productId = parsePositiveInt(product_id);
    const orderId = parsePositiveInt(order_id);
    const parsedRating = toFiniteNumber(rating);

    if (productId === null) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    if (orderId === null) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    if (
      parsedRating === null ||
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({
        error: "rating must be an integer between 1 and 5",
      });
    }

    if (
      comment !== undefined &&
      comment !== null &&
      comment !== "" &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({ error: "comment must be a string" });
    }

    const product = await db("products").where({ id: productId }).first();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Prevents users from reviewing products they did not actually purchase and receive.
    const eligibleItem = await db("orders")
      .join("order_items", "orders.id", "order_items.order_id")
      .where("orders.id", orderId)
      .andWhere("orders.user_id", userId)
      .andWhere("orders.status", "delivered")
      .andWhere("order_items.product_id", productId)
      .first();

    if (!eligibleItem) {
      return res.status(400).json({ error: VERIFIED_PURCHASE_ERROR });
    }

    const existingReview = await db("reviews")
      .where({
        user_id: userId,
        product_id: productId,
        order_id: orderId,
      })
      .first();

    if (existingReview) {
      return res.status(400).json({ error: DUPLICATE_REVIEW_ERROR });
    }

    const [review] = await db("reviews")
      .insert({
        user_id: userId,
        product_id: productId,
        order_id: orderId,
        rating: parsedRating,
        comment:
          typeof comment === "string" && comment.trim() !== ""
            ? comment.trim()
            : null,
      })
      .returning("*");

    return res.status(201).json(review);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: DUPLICATE_REVIEW_ERROR });
    }

    return res.status(500).json({ error: "Something went wrong" });
  }
}
