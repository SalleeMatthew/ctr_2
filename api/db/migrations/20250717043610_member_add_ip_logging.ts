import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('member', 'last_ip')) {
    console.log('Adding member ip logging to the member table');
    await knex.schema.alterTable('member', table => {
      table.string('last_ip').defaultTo(null);
      table.string('current_ip').defaultTo(null);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('member', 'last_ip')) {
    console.log('Dropping member ip logging to the member table');
    await knex.schema.alterTable('member', table => {
      table.dropColumn('last_ip');
      table.dropColumn('current_ip');
    });
  }
}


