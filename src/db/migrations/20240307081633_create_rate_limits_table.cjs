/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  if (! await knex.schema.hasTable('rate_limits')) {
    return knex.schema.createTable('rate_limits', (table) => {
      table.string('key').primary().unique().notNullable();
      table.integer('hits');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  if (await knex.schema.hasTable('rate_limits')) {
    return knex.schema.dropTable('rate_limits')
  }
};
