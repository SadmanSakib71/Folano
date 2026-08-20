import db from "../config/database";

const UNPAID_PREORDER_TIMEOUT_MINUTES = 30;

export async function cancelUnpaidPreorders() {
  try {
    const cutoff = new Date(Date.now() - UNPAID_PREORDER_TIMEOUT_MINUTES * 60 * 1000);

    const orders: Array<{ id: number }> = await db("orders")
      .where({
        order_type: "preorder",
        payment_status: "unpaid",
        status: "pending",
      })
      .andWhere("created_at", "<", cutoff)
      .select("id");

    if (orders.length === 0) {
      console.log("[Preorder Cancellation] No unpaid preorders to cancel");
      return;
    }

    let count = 0;

    for (const order of orders) {
      try {
        const cancelled = await db.transaction(async (trx) => {
          const lockedOrder = await trx("orders")
            .where({
              id: order.id,
              order_type: "preorder",
              payment_status: "unpaid",
              status: "pending",
            })
            .forUpdate()
            .first();

          if (!lockedOrder) {
            return false;
          }

          const items: Array<{ batch_id: number | null; quantity: string | number }> =
            await trx("order_items")
              .where({ order_id: order.id })
              .select("batch_id", "quantity");

          for (const item of items) {
            if (item.batch_id == null) {
              continue;
            }

            const batch = await trx("preorder_batches")
              .where({ id: item.batch_id })
              .forUpdate()
              .first();

            if (!batch) {
              throw new Error(`Preorder batch ${item.batch_id} not found`);
            }

            const nextReserved = Math.max(
              0,
              Number(batch.reserved_quantity) - Number(item.quantity)
            );

            await trx("preorder_batches").where({ id: item.batch_id }).update({
              reserved_quantity: nextReserved,
              updated_at: trx.fn.now(),
            });
          }

          await trx("orders").where({ id: order.id }).update({
            status: "cancelled",
            updated_at: trx.fn.now(),
          });

          return true;
        });

        if (cancelled) {
          count += 1;
        }
      } catch (error) {
        console.error(
          "[Preorder Cancellation] Failed to cancel unpaid preorders:",
          error
        );
      }
    }

    if (count > 0) {
      console.log(
        `[Preorder Cancellation] Cancelled ${count} unpaid preorder(s)`
      );
    } else {
      console.log("[Preorder Cancellation] No unpaid preorders to cancel");
    }
  } catch (error) {
    console.error(
      "[Preorder Cancellation] Failed to cancel unpaid preorders:",
      error
    );
  }
}
