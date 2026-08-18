import { Request, Response } from "express";
import db from "../config/database";

const ALLOWED_STATUSES = ["open", "closed", "fulfilled", "cancelled"] as const;

type BatchStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedStatus(value: unknown): value is BatchStatus {
  return typeof value === "string" && ALLOWED_STATUSES.includes(value as BatchStatus);
}

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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function batchesWithProduct() {
  return db("preorder_batches")
    .join("products", "preorder_batches.product_id", "products.id")
    .select(
      "preorder_batches.id",
      "preorder_batches.product_id",
      "products.name as product_name",
      "preorder_batches.batch_name",
      "preorder_batches.total_quantity",
      "preorder_batches.reserved_quantity",
      db.raw(
        "(preorder_batches.total_quantity - preorder_batches.reserved_quantity) as available_quantity"
      ),
      "preorder_batches.price_per_unit",
      "preorder_batches.preorder_start_date",
      "preorder_batches.preorder_end_date",
      "preorder_batches.expected_delivery_date",
      "preorder_batches.status",
      "preorder_batches.created_at",
      "preorder_batches.updated_at"
    );
}

export async function getAllBatches(req: Request, res: Response) {
  try {
    const query = batchesWithProduct();
    const status = req.query.status;

    if (typeof status === "string" && status.trim() !== "") {
      query.where("preorder_batches.status", status);
    }

    const batches = await query.orderBy("preorder_batches.id", "asc");
    return res.status(200).json(batches);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getBatchById(req: Request, res: Response) {
  try {
    const batchId = Number(req.params.id);

    if (!Number.isInteger(batchId) || batchId <= 0) {
      return res.status(404).json({ error: "Preorder batch not found" });
    }

    const batch = await batchesWithProduct()
      .where("preorder_batches.id", batchId)
      .first();

    if (!batch) {
      return res.status(404).json({ error: "Preorder batch not found" });
    }

    return res.status(200).json(batch);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function createBatch(req: Request, res: Response) {
  try {
    const {
      product_id,
      batch_name,
      total_quantity,
      price_per_unit,
      preorder_start_date,
      preorder_end_date,
      expected_delivery_date,
      status,
    } = req.body;

    if (
      product_id === undefined ||
      product_id === null ||
      product_id === "" ||
      !isNonEmptyString(batch_name) ||
      total_quantity === undefined ||
      total_quantity === null ||
      total_quantity === "" ||
      price_per_unit === undefined ||
      price_per_unit === null ||
      price_per_unit === "" ||
      !isNonEmptyString(preorder_start_date) ||
      !isNonEmptyString(preorder_end_date) ||
      !isNonEmptyString(expected_delivery_date)
    ) {
      return res.status(400).json({
        error:
          "product_id, batch_name, total_quantity, price_per_unit, preorder_start_date, preorder_end_date, and expected_delivery_date are required",
      });
    }

    const productId = toFiniteNumber(product_id);
    const totalQuantity = toFiniteNumber(total_quantity);
    const pricePerUnit = toFiniteNumber(price_per_unit);

    if (productId === null || !Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: "product_id is invalid" });
    }

    if (totalQuantity === null || totalQuantity <= 0) {
      return res.status(400).json({ error: "total_quantity must be greater than 0" });
    }

    if (pricePerUnit === null || pricePerUnit < 0) {
      return res.status(400).json({ error: "price_per_unit must be greater than or equal to 0" });
    }

    let batchStatus: BatchStatus = "open";

    if (status !== undefined && status !== null && status !== "") {
      if (!isAllowedStatus(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      batchStatus = status;
    }

    const product = await db("products").where({ id: productId }).first();

    if (!product) {
      return res.status(400).json({ error: "Product does not exist" });
    }

    const [created] = await db("preorder_batches")
      .insert({
        product_id: productId,
        batch_name: batch_name.trim(),
        total_quantity: totalQuantity,
        reserved_quantity: 0,
        price_per_unit: pricePerUnit,
        preorder_start_date: preorder_start_date.trim(),
        preorder_end_date: preorder_end_date.trim(),
        expected_delivery_date: expected_delivery_date.trim(),
        status: batchStatus,
      })
      .returning("id");

    const batch = await batchesWithProduct()
      .where("preorder_batches.id", created.id)
      .first();

    return res.status(201).json(batch);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function updateBatchStatus(req: Request, res: Response) {
  try {
    const status = req.body?.status;

    if (!isAllowedStatus(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const batchId = Number(req.params.id);

    if (!Number.isInteger(batchId) || batchId <= 0) {
      return res.status(404).json({ error: "Preorder batch not found" });
    }

    const existing = await db("preorder_batches").where({ id: batchId }).first();

    if (!existing) {
      return res.status(404).json({ error: "Preorder batch not found" });
    }

    await db("preorder_batches").where({ id: batchId }).update({
      status,
      updated_at: db.fn.now(),
    });

    const batch = await batchesWithProduct()
      .where("preorder_batches.id", batchId)
      .first();

    return res.status(200).json(batch);
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}
