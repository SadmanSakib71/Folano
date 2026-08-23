import type { Knex } from "knex";

const ORDER_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Short readable codes such as FS-2K9X7, used as a WhatsApp / bKash reference.
function generateOrderCode(): string {
  let suffix = "";

  for (let i = 0; i < 5; i++) {
    suffix += ORDER_CODE_CHARS[Math.floor(Math.random() * ORDER_CODE_CHARS.length)];
  }

  return `FS-${suffix}`;
}

function generateUniqueOrderCode(used: Set<string>): string {
  let code = generateOrderCode();

  while (used.has(code)) {
    code = generateOrderCode();
  }

  used.add(code);
  return code;
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    // Nullable first so existing rows can be backfilled before NOT NULL is applied.
    table.string("order_code").nullable();
    table.string("bkash_number_used").nullable();
    table.string("bkash_trx_last_digits").nullable();
    table.timestamp("payment_submitted_at").nullable();
    table.timestamp("payment_confirmed_at").nullable();
  });

  const existingOrders: Array<{ id: number; order_code: string | null }> = await knex("orders")
    .select("id", "order_code");

  const usedCodes = new Set(
    existingOrders
      .map((order) => order.order_code)
      .filter((code): code is string => typeof code === "string" && code.length > 0)
  );

  for (const order of existingOrders) {
    if (order.order_code) {
      continue;
    }

    await knex("orders").where({ id: order.id }).update({
      order_code: generateUniqueOrderCode(usedCodes),
    });
  }

  await knex.schema.alterTable("orders", (table) => {
    table.string("order_code").notNullable().alter();
    table.unique(["order_code"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.dropUnique(["order_code"]);
    table.dropColumn("order_code");
    table.dropColumn("bkash_number_used");
    table.dropColumn("bkash_trx_last_digits");
    table.dropColumn("payment_submitted_at");
    table.dropColumn("payment_confirmed_at");
  });
}
