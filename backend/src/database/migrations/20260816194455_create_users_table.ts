import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    // Phone is the main login identifier
    table.string("phone").notNullable().unique();
    table.string("email").nullable();
    // Stores the hashed password, never the plain text password
    table.string("password_hash").notNullable();
    // Supported values: "customer" and "admin"
    table.string("role").notNullable().defaultTo("customer");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}
