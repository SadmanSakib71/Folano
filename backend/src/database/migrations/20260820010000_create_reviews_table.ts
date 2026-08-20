import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("reviews", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    table
      .integer("product_id")
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete("RESTRICT");
    table
      .integer("order_id")
      .notNullable()
      .references("id")
      .inTable("orders")
      .onDelete("RESTRICT");
    table.integer("rating").notNullable();
    table.text("comment").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.check("rating >= 1 AND rating <= 5");
    table.unique(["user_id", "product_id", "order_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("reviews");
}
