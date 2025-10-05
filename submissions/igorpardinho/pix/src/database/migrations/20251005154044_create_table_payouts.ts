import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("payouts",(table) => {
        table.uuid("id").primary();
        table.string("external_id").notNullable().unique();
        table.string("user_id").notNullable();
        table.integer("amount_cents").notNullable();
        table.string("pix_key").notNullable()
        table.enum("status",["paid","failed","duplicate"]).notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("payouts")
}

