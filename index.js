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

bot.command('start', async (ctx) => {
		try {
				ctx.session.awaitingSecret = true;
				await ctx.reply("Введите секретное слово для доступа к боту:");
		} catch (error) {
				console.error('Error in /start command:', error);
				await ctx.reply("Произошла ошибка при обработке команды /start.");
		}
});

bot.command('clear', async (ctx) => {
		try {
				const chatId = ctx.chat.id;
				const users = await getUsers();

				const userExists = users.includes(chatId);
				if (!userExists) {
						return await ctx.reply("У вас нет доступа к этой команде.");
				}

				for (let i = 0; i < 100; i++) {
						try {
								await ctx.api.deleteMessage(chatId, ctx.message.message_id - i);
						} catch (e) {
								continue;
						}
				}

				await ctx.reply("Чат очищен.");
		} catch (error) {
				console.error('Error in /clear command:', error);
				await ctx.reply("Произошла ошибка при очистке чата.");
		}
});

bot.on('message', async (ctx) => {
		try {
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
		} catch (error) {
				console.error('Error in message handler:', error);
		}
});

bot.catch((error) => {
		console.error('Error in bot:', error);
});


bot.start();
