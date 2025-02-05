import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('whisper')) {
    await knex.schema.createTable('whisper', table => {
      console.log('Creating whisper table');
      applyCommon(table);
            
      table.integer('place_id', 10)
        .unsigned()
        .notNullable();
            
      table.integer('sender_member_id')
        .unsigned()
        .notNullable();

      table.integer('recipient_member_id')
        .unsigned()
        .notNullable();
            
      table.text('message')
        .notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('whisper')) {
    console.log('Dropping whisper table');
    await knex.schema.dropTable('whisper');
  }
}

