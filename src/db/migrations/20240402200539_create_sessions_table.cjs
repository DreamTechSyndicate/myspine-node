/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async(knex) => {
  if (! await knex.schema.hasTable('sessions')) {
    return knex.schema.createTable('sessions', (table) => {
      table.string('sid').primary().unique().notNullable();
      table.json('sess').notNullable();
      table.string('expire').notNullable();
    })
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async(knex) => {
  if (await knex.schema.hasTable('sessions')) {
    return knex.schema.dropTable('sessions')
  }
};
