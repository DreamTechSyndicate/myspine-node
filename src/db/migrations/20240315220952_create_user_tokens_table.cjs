/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_tokens', (table) => {
    table.increments('id')
         .primary()
         .unique()
         .notNullable();
    table.integer('user_id')
         .references('id')
         .inTable('users')
         .onDelete('CASCADE')
         .onUpdate('CASCADE')
         .index();
    table.text('access_token');
    table.text('refresh_token');
    table.text('reset_password_token');
    table.timestamp('access_token_expires_at');
    table.timestamp('refresh_token_expires_at');
    table.timestamp('reset_password_token_expires_at');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_tokens')
};