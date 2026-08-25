import { Request, Response } from "express";
import type { Knex } from "knex";
import db from "../config/database";
import { generateOrderCode, isUniqueConstraintError } from "../utils/orderCode";

class OrderError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "OrderError";
    this.statusCode = statusCode;
  }
}

type OrderRow = {
  id: number;
  user_id: number;
  order_code: string;
  address_text: string;
  order_type: string;
  status: string;
  subtotal: string | number;
  delivery_charge: string | number;
  total_amount: string | number;
  payment_status: string;
  bkash_number_used: string | null;
  bkash_trx_last_digits: string | null;
  payment_submitted_at: string | Date | null;
  payment_confirmed_at: string | Date | null;
  expected_delivery_date: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: string | number;
  unit_price: string | number;
  subtotal: string | number;
  batch_id: number | null;
};

const ALLOWED_ORDER_TYPES = ["normal", "preorder"] as const;
const ALLOWED_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
const ALLOWED_PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;

type AllowedOrderType = (typeof ALLOWED_ORDER_TYPES)[number];
type AllowedOrderStatus = (typeof ALLOWED_ORDER_STATUSES)[number];
type AllowedPaymentStatus = (typeof ALLOWED_PAYMENT_STATUSES)[number];

function isAllowedOrderType(value: unknown): value is AllowedOrderType {
  return typeof value === "string" && ALLOWED_ORDER_TYPES.includes(value as AllowedOrderType);
}

function isAllowedOrderStatus(value: unknown): value is AllowedOrderStatus {
  return typeof value === "string" && ALLOWED_ORDER_STATUSES.includes(value as AllowedOrderStatus);
}

function isAllowedPaymentStatus(value: unknown): value is AllowedPaymentStatus {
  return (
    typeof value === "string" && ALLOWED_PAYMENT_STATUSES.includes(value as AllowedPaymentStatus)
  );
}

function isExactlyThreeDigits(value: unknown): value is string {
  return typeof value === "string" && /^\d{3}$/.test(value);
}

function normalizeOptionalBkashNumber(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseOrderId(value: string | string[]): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const orderId = Number(raw);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return null;
  }

  return orderId;
}

type MergedItem = {
  product_id: number;
  quantity: number;
};

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

function parseAndMergeItems(items: unknown): MergedItem[] {
  if (!Array.isArray(items)) {
    throw new OrderError(400, "items is required and must be an array");
  }

  if (items.length === 0) {
    throw new OrderError(400, "items must contain at least one item");
  }

  const merged = new Map<number, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (typeof item !== "object" || item === null) {
      throw new OrderError(400, `items[${i}] must contain product_id and quantity`);
    }

    const row = item as { product_id?: unknown; quantity?: unknown };

    if (row.product_id === undefined || row.product_id === null || row.product_id === "") {
      throw new OrderError(400, `items[${i}] must contain product_id`);
    }

    if (row.quantity === undefined || row.quantity === null || row.quantity === "") {
      throw new OrderError(400, `items[${i}] must contain quantity`);
    }

    const productId = toFiniteNumber(row.product_id);
    const quantity = toFiniteNumber(row.quantity);

    if (productId === null || !Number.isInteger(productId) || productId <= 0) {
      throw new OrderError(400, `items[${i}] has an invalid product_id`);
    }

    if (quantity === null || quantity <= 0) {
      throw new OrderError(400, `items[${i}] quantity must be a number greater than 0`);
    }

    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  return Array.from(merged.entries())
    .map(([product_id, quantity]) => ({ product_id, quantity }))
    .sort((a, b) => a.product_id - b.product_id);
}

async function fetchOrderItems(
  conn: Knex | Knex.Transaction,
  orderIds: number[]
): Promise<OrderItemRow[]> {
  if (orderIds.length === 0) {
    return [];
  }

  return conn("order_items")
    .join("products", "order_items.product_id", "products.id")
    .whereIn("order_items.order_id", orderIds)
    .select(
      "order_items.id",
      "order_items.order_id",
      "order_items.product_id",
      "products.name as product_name",
      "order_items.quantity",
      "order_items.unit_price",
      "order_items.subtotal",
      "order_items.batch_id"
    )
    .orderBy("order_items.id", "asc");
}

function attachItemsToOrders<T extends { id: number }>(orders: T[], items: OrderItemRow[]) {
  const itemsByOrderId = new Map<number, Omit<OrderItemRow, "order_id">[]>();

  for (const item of items) {
    const existing = itemsByOrderId.get(item.order_id) ?? [];
    existing.push({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      batch_id: item.batch_id,
    });
    itemsByOrderId.set(item.order_id, existing);
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) ?? [],
  }));
}

async function getOrderWithItems(conn: Knex | Knex.Transaction, orderId: number) {
  const order: OrderRow | undefined = await conn("orders").where({ id: orderId }).first();

  if (!order) {
    return null;
  }

  const items = await fetchOrderItems(conn, [orderId]);
  return attachItemsToOrders([order], items)[0];
}

// order_code is generated here so customers can quote a short reference
// (e.g. FS-2K9X7) on WhatsApp or in a bKash payment note.
async function insertOrderWithUniqueCode(
  trx: Knex.Transaction,
  data: Record<string, unknown>
): Promise<number> {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orderCode = generateOrderCode();
    const existing = await trx("orders").where({ order_code: orderCode }).first("id");

    if (existing) {
      continue;
    }

    try {
      const [created] = await trx("orders")
        .insert({ ...data, order_code: orderCode })
        .returning("id");
      return created.id as number;
    } catch (error) {
      // Two requests can theoretically generate the same code; retry with a new one.
      if (isUniqueConstraintError(error) && attempt < maxAttempts - 1) {
        continue;
      }

      throw error;
    }
  }

  throw new OrderError(500, "Could not generate a unique order code");
}

export async function createOrder(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { address_text, delivery_charge, items } = req.body;

    if (typeof address_text !== "string" || address_text.trim() === "") {
      return res.status(400).json({
        error: "address_text is required and must be a non-empty string",
      });
    }

    const parsedDeliveryCharge = toFiniteNumber(delivery_charge);

    if (parsedDeliveryCharge === null || parsedDeliveryCharge < 0) {
      return res.status(400).json({
        error: "delivery_charge is required and must be a number >= 0",
      });
    }

    const mergedItems = parseAndMergeItems(items);

    // The order, order items, and stock updates must either all succeed or all fail together.
    const orderId = await db.transaction(async (trx) => {
      const preparedItems: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
        subtotal: number;
        new_stock: number;
      }> = [];

      let orderSubtotal = 0;

      for (const item of mergedItems) {
        const product = await trx("products")
          .where({ id: item.product_id })
          .forUpdate()
          .first();

        if (!product || product.is_active !== true) {
          throw new OrderError(
            400,
            `Product with id ${item.product_id} does not exist or is inactive`
          );
        }

        const stockQuantity = Number(product.stock_quantity);
        const unitPrice = Number(product.price);

        if (item.quantity > stockQuantity) {
          throw new OrderError(
            400,
            `Requested quantity for "${product.name}" exceeds available stock`
          );
        }

        const itemSubtotal = item.quantity * unitPrice;
        orderSubtotal += itemSubtotal;

        preparedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal: itemSubtotal,
          new_stock: Math.max(0, Math.floor(stockQuantity - item.quantity)),
        });
      }

      const totalAmount = orderSubtotal + parsedDeliveryCharge;

      const createdId = await insertOrderWithUniqueCode(trx, {
        user_id: userId,
        address_text: address_text.trim(),
        order_type: "normal",
        status: "pending",
        subtotal: orderSubtotal,
        delivery_charge: parsedDeliveryCharge,
        total_amount: totalAmount,
        payment_status: "unpaid",
      });

      await trx("order_items").insert(
        preparedItems.map((item) => ({
          order_id: createdId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        }))
      );

      for (const item of preparedItems) {
        const affected = await trx("products")
          .where({ id: item.product_id })
          .update({
            stock_quantity: item.new_stock,
            updated_at: trx.fn.now(),
          });

        if (affected === 0) {
          throw new OrderError(
            400,
            `Requested quantity for product ${item.product_id} exceeds available stock`
          );
        }
      }

      return createdId;
    });

    const order = await getOrderWithItems(db, orderId);

    return res.status(201).json({ order });
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ error: "Something went wrong" });
  }
}

type PreorderBatchLockRow = {
  id: number;
  product_id: number;
  total_quantity: string | number;
  reserved_quantity: string | number;
  price_per_unit: string | number;
  expected_delivery_date: string | Date;
  status: string;
};

export async function createPreorder(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { batch_id, quantity, address_text } = req.body;

    if (batch_id === undefined || batch_id === null || batch_id === "") {
      return res.status(400).json({ error: "batch_id is required" });
    }

    if (quantity === undefined || quantity === null || quantity === "") {
      return res.status(400).json({ error: "quantity is required" });
    }

    if (typeof address_text !== "string" || address_text.trim() === "") {
      return res.status(400).json({
        error: "address_text is required and must be a non-empty string",
      });
    }

    const batchId = toFiniteNumber(batch_id);
    const parsedQuantity = toFiniteNumber(quantity);

    if (batchId === null || !Number.isInteger(batchId) || batchId <= 0) {
      return res.status(400).json({ error: "batch_id is invalid" });
    }

    if (parsedQuantity === null || parsedQuantity <= 0) {
      return res.status(400).json({ error: "quantity must be greater than 0" });
    }

    const orderId = await db.transaction(async (trx) => {
      // The preorder batch row is locked with SELECT ... FOR UPDATE.
      // If two customers try to reserve the last available quantity at the same time,
      // the first transaction locks the row and checks/updates reserved_quantity.
      // The second transaction waits until the first transaction finishes, then reads
      // the updated reserved_quantity.
      // Therefore both customers cannot reserve the same remaining quantity.
      const batch: PreorderBatchLockRow | undefined = await trx("preorder_batches")
        .where({ id: batchId })
        .forUpdate()
        .first();

      if (!batch) {
        throw new OrderError(404, "Preorder batch not found");
      }

      if (batch.status !== "open") {
        throw new OrderError(400, "Preorder batch is not open");
      }

      const availableQuantity =
        Number(batch.total_quantity) - Number(batch.reserved_quantity);

      if (availableQuantity < parsedQuantity) {
        throw new OrderError(400, "Not enough quantity available");
      }

      const deliveryCharge = 100;
      const subtotal = parsedQuantity * Number(batch.price_per_unit);
      const totalAmount = deliveryCharge;

      const createdId = await insertOrderWithUniqueCode(trx, {
        user_id: userId,
        address_text: address_text.trim(),
        order_type: "preorder",
        status: "pending",
        subtotal,
        delivery_charge: deliveryCharge,
        total_amount: totalAmount,
        payment_status: "unpaid",
        expected_delivery_date: batch.expected_delivery_date,
      });

      await trx("order_items").insert({
        order_id: createdId,
        product_id: batch.product_id,
        batch_id: batchId,
        quantity: parsedQuantity,
        unit_price: Number(batch.price_per_unit),
        subtotal,
      });

      const affected = await trx("preorder_batches")
        .where({ id: batchId })
        .andWhereRaw("reserved_quantity + ? <= total_quantity", [parsedQuantity])
        .update({
          reserved_quantity: trx.raw("reserved_quantity + ?", [parsedQuantity]),
          updated_at: trx.fn.now(),
        });

      if (affected === 0) {
        throw new OrderError(400, "Not enough quantity available");
      }

      return createdId;
    });

    const order = await getOrderWithItems(db, orderId);

    return res.status(201).json({ order });
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({ error: "Something went wrong" });
  }
}

// The customer is only submitting proof of payment here.
// payment_status stays unpaid until an admin manually verifies and confirms it.
// payment_submitted_at is set so we know a claim exists, without marking the order paid.
export async function submitPaymentClaim(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { order_id, bkash_number_used, bkash_trx_last_digits } = req.body;
    const orderId = toFiniteNumber(order_id);

    if (orderId === null || !Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "order_id is required and must be a valid order id" });
    }

    const order: OrderRow | undefined = await db("orders").where({ id: orderId }).first();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: "You do not have access to this order" });
    }

    const normalizedBkashNumber = normalizeOptionalBkashNumber(bkash_number_used);

    if (!isExactlyThreeDigits(bkash_trx_last_digits)) {
      return res.status(400).json({
        error: "bkash_trx_last_digits must be exactly 3 numeric digits",
      });
    }

    // Only the payment-claim fields change. Totals, items, stock, status, and
    // payment_status stay the same. payment_confirmed_at is left untouched.
    // bkash_number_used is optional: omitted/empty values are stored as NULL.
    await db("orders").where({ id: orderId }).update({
      bkash_number_used: normalizedBkashNumber,
      bkash_trx_last_digits,
      payment_submitted_at: db.fn.now(),
    });

    const updated = await getOrderWithItems(db, orderId);

    return res.status(200).json({ order: updated });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getMyOrders(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders: OrderRow[] = await db("orders")
      .where({ user_id: req.user.id })
      .orderBy("created_at", "desc");

    const items = await fetchOrderItems(
      db,
      orders.map((order) => order.id)
    );

    return res.status(200).json(attachItemsToOrders(orders, items));
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = await getOrderWithItems(db, orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You do not have access to this order" });
    }

    return res.status(200).json({ order });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getAllOrders(req: Request, res: Response) {
  try {
    const status = req.query.status;
    const orderType = req.query.order_type;

    // Only accept the known order types used by this shop.
    if (orderType !== undefined && orderType !== "") {
      if (!isAllowedOrderType(orderType)) {
        return res.status(400).json({ message: "Invalid order_type" });
      }
    }

    // Join users so the admin list can show the customer's name and phone.
    const query = db("orders")
      .join("users", "orders.user_id", "users.id")
      .select(
        "orders.id",
        "orders.user_id",
        "users.name as customer_name",
        "users.phone as customer_phone",
        "orders.order_type",
        "orders.status",
        "orders.payment_status",
        "orders.address_text",
        "orders.delivery_charge",
        "orders.subtotal",
        "orders.total_amount",
        "orders.expected_delivery_date",
        "orders.created_at"
      )
      .orderBy("orders.created_at", "desc");

    if (typeof status === "string" && status.trim() !== "") {
      query.where("orders.status", status);
    }

    if (isAllowedOrderType(orderType)) {
      query.where("orders.order_type", orderType);
    }

    const orders = await query;

    // Join order_items → products so each order includes product names and batch_id.
    const items = await fetchOrderItems(
      db,
      orders.map((order) => order.id)
    );

    return res.status(200).json(attachItemsToOrders(orders, items));
  } catch {
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = parseOrderId(req.params.id);

    if (orderId === null) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { status } = req.body;

    if (status === undefined || status === null || status === "") {
      return res.status(400).json({ message: "status is required" });
    }

    if (!isAllowedOrderStatus(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const existing = await db("orders").where({ id: orderId }).first();

    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the order status changes. Items, totals, stock, and payment stay the same.
    await db("orders").where({ id: orderId }).update({ status });

    const order = await getOrderWithItems(db, orderId);

    return res.status(200).json({ order });
  } catch {
    return res.status(500).json({ message: "Something went wrong" });
  }
}

export async function updatePaymentStatus(req: Request, res: Response) {
  try {
    const orderId = parseOrderId(req.params.id);

    if (orderId === null) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { payment_status } = req.body;

    if (payment_status === undefined || payment_status === null || payment_status === "") {
      return res.status(400).json({ message: "payment_status is required" });
    }

    if (!isAllowedPaymentStatus(payment_status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const existing = await db("orders").where({ id: orderId }).first();

    if (!existing) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only payment_status changes. Order status, items, totals, and stock stay the same.
    await db("orders").where({ id: orderId }).update({ payment_status });

    const order = await getOrderWithItems(db, orderId);

    return res.status(200).json({ order });
  } catch {
    return res.status(500).json({ message: "Something went wrong" });
  }
}

// This endpoint gives admins a queue of customer-submitted payment claims waiting for verification.
export async function getPendingPaymentClaims(req: Request, res: Response) {
  try {
    const orders = await db("orders")
      .join("users", "orders.user_id", "users.id")
      .whereNotNull("orders.payment_submitted_at")
      .whereNot("orders.payment_status", "paid")
      .select(
        "orders.id",
        "orders.user_id",
        "orders.order_code",
        "users.name as customer_name",
        "users.phone as customer_phone",
        "orders.order_type",
        "orders.status",
        "orders.payment_status",
        "orders.address_text",
        "orders.delivery_charge",
        "orders.subtotal",
        "orders.total_amount",
        "orders.bkash_number_used",
        "orders.bkash_trx_last_digits",
        "orders.payment_submitted_at",
        "orders.payment_confirmed_at",
        "orders.expected_delivery_date",
        "orders.created_at"
      )
      .orderBy("orders.payment_submitted_at", "asc");

    const items = await fetchOrderItems(
      db,
      orders.map((order) => order.id)
    );

    return res.status(200).json(attachItemsToOrders(orders, items));
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const orderId = parseOrderId(req.params.id);

    if (orderId === null) {
      return res.status(404).json({ error: "Order not found" });
    }

    const existing: OrderRow | undefined = await db("orders").where({ id: orderId }).first();

    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existing.payment_status === "paid") {
      return res.status(400).json({ error: "পেমেন্ট ইতিমধ্যে নিশ্চিত করা হয়েছে" });
    }

    if (existing.payment_submitted_at == null) {
      return res.status(400).json({ error: "এই অর্ডারের কোনো পেমেন্ট ক্লেইম নেই" });
    }

    // Preorders only collect the delivery charge up front, so confirmation
    // marks them partial. Normal orders pay the full amount, so they become paid.
    const paymentStatus = existing.order_type === "preorder" ? "partial" : "paid";
    const nextStatus = existing.status === "pending" ? "confirmed" : existing.status;

    await db("orders").where({ id: orderId }).update({
      payment_status: paymentStatus,
      status: nextStatus,
      payment_confirmed_at: db.fn.now(),
    });

    const order = await getOrderWithItems(db, orderId);

    return res.status(200).json({ order });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}

export async function rejectPaymentClaim(req: Request, res: Response) {
  try {
    const orderId = parseOrderId(req.params.id);

    if (orderId === null) {
      return res.status(404).json({ error: "Order not found" });
    }

    const existing: OrderRow | undefined = await db("orders").where({ id: orderId }).first();

    if (!existing) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existing.payment_submitted_at == null) {
      return res.status(400).json({ error: "এই অর্ডারের কোনো পেমেন্ট ক্লেইম নেই" });
    }

    if (existing.payment_status === "paid") {
      return res.status(400).json({ error: "পেমেন্ট ইতিমধ্যে নিশ্চিত করা হয়েছে" });
    }

    const reason = req.body?.reason;

    if (typeof reason === "string" && reason.trim() !== "") {
      console.log(`Payment claim rejected for order ${orderId}: ${reason}`);
    }

    await db("orders").where({ id: orderId }).update({
      bkash_number_used: null,
      bkash_trx_last_digits: null,
      payment_submitted_at: null,
      payment_status: "unpaid",
    });

    const order = await getOrderWithItems(db, orderId);

    return res.status(200).json({ order });
  } catch {
    return res.status(500).json({ error: "Something went wrong" });
  }
}
