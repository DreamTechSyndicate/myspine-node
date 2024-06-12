/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('patients', (table) => {
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
    table.text('firstname').notNullable()
    table.text('lastname').notNullable()
    table.text('pain_description').notNullable()
    table.integer('pain_degree').notNullable()
    table.text('address')
    table.text('email').notNullable().unique()
    table.string('phone_number').notNullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('patients')
};