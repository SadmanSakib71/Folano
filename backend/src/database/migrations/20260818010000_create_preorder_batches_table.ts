import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("preorder_batches", (table) => {
    table.increments("id").primary();
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("RESTRICT");
    // Example: "জুন ২০২৭ হিমসাগর"
    table.string("batch_name").notNullable();
    table.decimal("total_quantity").notNullable();
    table.decimal("reserved_quantity").notNullable().defaultTo(0);
    table.decimal("price_per_unit").notNullable();
    table.date("preorder_start_date").notNullable();
    table.date("preorder_end_date").notNullable();
    table.date("expected_delivery_date").notNullable();
    // Expected values: open, closed, fulfilled, cancelled
    table.string("status").notNullable().defaultTo("open");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("preorder_batches");
}
