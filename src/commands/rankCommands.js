import { COMMANDS } from '../constants/index.js';

export function setupRankCommand(bot, db, statsService, rankService) {
  // Команда /rank
  bot.onText(new RegExp(`^${COMMANDS.RANK}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const userStats = statsService.getUserStats(userId, chatId);
    const message = rankService.formatUserRank(userStats);

    bot.sendMessage(chatId, message);
  });
}

export function setupRanksCommand(bot, rankService) {
  // Команда /ranks
  bot.onText(new RegExp(`^${COMMANDS.RANKS}$`), (msg) => {
    const chatId = msg.chat.id;
    const message = rankService.formatRanksByCategory();

    bot.sendMessage(chatId, message);
  });
}
