import 'dotenv/config';
import { Bot, session } from 'grammy';
import User from './models/User.js';
import knex from './knex.js';

const bot = new Bot(process.env.BOT_TOKEN);
const inviteToken = process.env.INVITE_TOKEN;

const addUser = async (chatId) => {
		await knex('users').insert({ chat_id: chatId }).onConflict('chat_id').ignore();
};

const getUsers = async () => {
		const users = await knex('users').select('chat_id');
		return users.map(user => user.chat_id);
};

bot.use(session({ initial: () => ({ awaitingSecret: false }) }));

bot.api.setMyCommands([
		{ command: 'start', description: 'Начать работу с ботом' },
		{ command: 'clear', description: 'Очистить чат' }
]);

bot.command('start', (ctx) => {
		ctx.session.awaitingSecret = true;
		ctx.reply("Введите секретное слово для доступа к боту:");
});

bot.command('clear', async (ctx) => {
		const chatId = ctx.chat.id;
		const users = await getUsers();
		// Проверяем, что пользователь существует в базе данных
		const userExists = users.includes(chatId);
		if (!userExists) {
				return ctx.reply("У вас нет доступа к этой команде.");
		}

		// Удаляем сообщения (для Telegram бота это означает отправку пустого сообщения с reply_markup для удаления кнопок)
		const deleteMessages = async (chatId, messageId) => {
				await ctx.api.deleteMessage(chatId, messageId);
		};

		// Прокручиваем последние сообщения и удаляем их
		for (let i = 0; i < 100; i++) {
				try {
						await deleteMessages(chatId, ctx.message.message_id - i);
				} catch (e) {
						// Если не удается удалить сообщение (возможно, сообщение старое или уже удалено), продолжаем
						continue;
				}
		}

		await ctx.reply("Чат очищен.");
});

bot.on('message', async (ctx) => {
		const chatId = ctx.chat.id;

		if (ctx.session.awaitingSecret) {
				ctx.session.awaitingSecret = false;
				if (ctx.message.text === inviteToken) {
						await addUser(chatId);
						await ctx.reply("Добро пожаловать! Теперь вы будете получать все сообщения.");
				} else {
						await ctx.reply("Неверное секретное слово. Доступ к боту запрещен.");
				}
				return;
		}

		const users = await getUsers();
		for (const user of users) {
				if (user !== chatId) {
						await bot.api.sendMessage(user, ctx.message.text);
				}
		}
});

bot.start();
