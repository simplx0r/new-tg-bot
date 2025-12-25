import { COMMANDS, EMOJI } from '../constants/index.js';

export function setupJokeCommands(bot, jokeService) {
  // Команда /joke
  bot.onText(/^\/joke(?:\s+(\w+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const category = match[1] || null;

    jokeService.sendJoke(bot, chatId, category);
  });
}

export function setupAddJokeCommand(bot, db, jokeService) {
  // Команда /addjoke (только для админов)
  bot.onText(/^\/addjoke\s+(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      bot.sendMessage(chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const jokeText = match[1].trim();
    jokeService.addCustomJoke(jokeText);

    bot.sendMessage(chatId, `${EMOJI.CHECK} Шутка добавлена в базу!`);
  });
}

export function setupJokesCommand(bot, db, jokeService) {
  // Команда /jokes (только для админов)
  bot.onText(new RegExp(`^${COMMANDS.JOKES}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      bot.sendMessage(chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const jokes = jokeService.getAllJokes();
    const message = jokeService.formatJokesList(jokes);

    bot.sendMessage(chatId, message);
  });
}

export function setupJokeStatsCommand(bot, db, jokeService) {
  // Команда /jokestats (только для админов)
  bot.onText(new RegExp(`^${COMMANDS.JOKE_STATS}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      bot.sendMessage(chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const stats = jokeService.getJokeStats();
    const message = jokeService.formatJokeStats(stats);

    bot.sendMessage(chatId, message);
  });
}
