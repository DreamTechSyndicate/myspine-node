/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async(knex) => {
  if (! await knex.schema.hasTable('customers')) {
    return knex.schema.createTable('customers', (table) => {
      table.increments('id')
          .primary()
          .unique()
          .notNullable()
      table.integer('user_id')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE')
          .onUpdate('CASCADE')
          .index();
      table.string('firstname');
      table.string('lastname');
      table.string('email');
      table.string('phone_number');
      table.boolean('is_consented');
      table.string('age');
      table.string('sex');
      table.string('height');
      table.string('weight');
      table.string('occupation');
      table.string('acute_pain_type');
      table.text('pain_summary');
      table.string('pain_degree');
      table.string('pain_description');
      table.string('pain_duration');
      table.string('activity_level');
      table.text('pain_areas');
      table.string('pain_start_type');
      table.text('pain_start_causes');
      table.string('physical_therapy_history');
      table.string('offered_spinal_surgery');
      table.string('spine_imaging_types');
      table.string('previous_spinal_surgery');
      table.string('limb_weakness_numbness');
      table.string('walking_unsteadiness');
      table.string('offered_procedure');
      table.string('offered_by');
      table.string('discussed_result');
      table.string('surgery_type');
      table.string('surgery_date_time');
      table.string('surgeon');
      table.string('hand_object_manipulation_problem');
      table.string('past_pain_medication');
      table.string('current_pain_medication');
      table.text('painful_activities');
      table.text('painful_leg_activities');
      table.text('helpful_activities');
      table.string('unoperational_due_to_pain');
      table.string('physician_visit_for_pain');
      table.string('injection_procedure_for_pain');
      table.text('injection_types');
      table.string('injection_relief');
      table.string('helpful_injection');
      table.string('injection_relief_duration');
      table.string('medical_problem');
      table.string('current_medication');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async(knex) => {
  if (await knex.schema.hasTable('customers')) {
    return knex.schema.dropTable('customers')
  }
};
