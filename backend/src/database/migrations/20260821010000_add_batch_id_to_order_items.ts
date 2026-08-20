import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("order_items", (table) => {
    table
      .integer("batch_id")
      .nullable()
      .references("id")
      .inTable("preorder_batches")
      .onDelete("RESTRICT");
    table.index("batch_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("order_items", (table) => {
    table.dropColumn("batch_id");
  });
}
