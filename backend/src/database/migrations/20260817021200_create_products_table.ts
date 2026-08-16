import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    // Required category; RESTRICT blocks deleting a category that still has products
    table
      .integer("category_id")
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("RESTRICT");
    table.string("name").notNullable();
    // URL-friendly identifier, unique across products
    table.string("slug").notNullable().unique();
    table.text("description").nullable();
    // Examples: "kg", "piece", "dozen"
    table.string("unit").notNullable();
    table.decimal("price").notNullable();
    table.string("image_url").nullable();
    table.boolean("is_seasonal").notNullable().defaultTo(false);
    table.boolean("is_preorder_only").notNullable().defaultTo(false);
    table.integer("stock_quantity").notNullable().defaultTo(0);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("products");
}
