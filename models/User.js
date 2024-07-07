import knex from '../knex.js';

class User {
		static findByTelegramId = async (telegramId) => await knex('users').where({ telegram_id: telegramId }).first();

		static create = async (telegramId, childName) => await knex('users').insert({ telegram_id: telegramId, child_name: childName });

}

export default User;

