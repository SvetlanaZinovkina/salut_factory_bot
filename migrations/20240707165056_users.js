export const up = (knex) => (
		knex.schema.createTable('users', (table) => {
				table.increments('id').primary();
				table.bigInteger('chat_id').unique().notNullable();
				table.timestamps(true, true);
		})
);

export const down = (knex) => knex.schema.dropTable('users');
