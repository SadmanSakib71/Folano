import { Request, Response } from "express";
import type { Knex } from "knex";
import db from "../config/database";

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
  address_text: string;
  order_type: string;
  status: string;
  subtotal: string | number;
  delivery_charge: string | number;
  total_amount: string | number;
  payment_status: string;
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
};

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
      "order_items.subtotal"
    )
    .orderBy("order_items.id", "asc");
}

function attachItemsToOrders(orders: OrderRow[], items: OrderItemRow[]) {
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

      const [created] = await trx("orders")
        .insert({
          user_id: userId,
          address_text: address_text.trim(),
          order_type: "normal",
          status: "pending",
          subtotal: orderSubtotal,
          delivery_charge: parsedDeliveryCharge,
          total_amount: totalAmount,
          payment_status: "unpaid",
        })
        .returning("id");

      await trx("order_items").insert(
        preparedItems.map((item) => ({
          order_id: created.id,
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

      return created.id as number;
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

      const [created] = await trx("orders")
        .insert({
          user_id: userId,
          address_text: address_text.trim(),
          order_type: "preorder",
          status: "pending",
          subtotal,
          delivery_charge: deliveryCharge,
          total_amount: totalAmount,
          payment_status: "unpaid",
          expected_delivery_date: batch.expected_delivery_date,
        })
        .returning("id");

      await trx("order_items").insert({
        order_id: created.id,
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

      return created.id as number;
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
