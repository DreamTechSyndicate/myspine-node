/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('users').del()
  await knex('users').insert([
    { id: 1, email: 'vipers@baroness.org', password: '34ReptilianSupremeComm@ndr43' },
    { id: 2, email: 'skoria@vipers.net', password: '0nix-0nly7HVN' },
    { id: 3, email: 'onix@cobra.io', password: '$k0r14Night' }
  ]);
};