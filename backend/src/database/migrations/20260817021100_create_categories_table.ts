import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    // Example: "দেশি সিজনাল", "বিদেশি ফল"
    table.string("name").notNullable();
    // URL-friendly identifier, example: "deshi-seasonal"
    table.string("slug").notNullable().unique();
    table.text("description").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("categories");
}
