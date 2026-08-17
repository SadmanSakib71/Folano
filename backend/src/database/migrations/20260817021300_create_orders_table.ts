import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("orders", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    // Delivery address stored as plain text for now
    table.text("address_text").notNullable();
    // Expected values: "normal" or "preorder"
    table.string("order_type").notNullable();
    // Expected values: pending, confirmed, processing, out_for_delivery, delivered, cancelled
    table.string("status").notNullable().defaultTo("pending");
    table.decimal("subtotal").notNullable();
    table.decimal("delivery_charge").notNullable().defaultTo(0);
    table.decimal("total_amount").notNullable();
    // Expected values: unpaid, partial, paid
    table.string("payment_status").notNullable().defaultTo("unpaid");
    table.date("expected_delivery_date").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("orders");
}
