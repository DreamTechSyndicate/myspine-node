/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async(knex) => {
  if (! await knex.schema.hasTable('customer_files')) {
    return knex.schema.createTable('customer_files', (table) => {
      table.increments('id').primary();
      table.integer('customer_id')
          .references('id')
          .inTable('customers')
          .onDelete('CASCADE')
          .onUpdate('CASCADE')
          .index();
      table.string('file_name').notNullable();
      table.string('file_type').notNullable(); // e.g., .jpg or .dcm
      table.integer('file_size').notNullable();
      table.string('dropbox_file_id').notNullable();
      table.string('dropbox_file_url').notNullable();
      table.timestamps(true, true);
    })
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async(knex) => {
  if (await knex.schema.hasTable('customer_files')) {
    return knex.schema.dropTable('customer_files')
  }
};
