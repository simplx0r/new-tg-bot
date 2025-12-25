import { COMMANDS } from '../constants/index.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

export function setupRankCommand(bot, db, statsService, rankService) {
  // Команда /rank
  bot.onText(new RegExp(`^${COMMANDS.RANK}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const userStats = statsService.getUserStats(userId, chatId);
    const message = rankService.formatUserRank(userStats);

    safeSendMessage(bot, chatId, message);
  });
}

export function setupRanksCommand(bot, rankService) {
  // Команда /ranks
  bot.onText(new RegExp(`^${COMMANDS.RANKS}$`), (msg) => {
    const chatId = msg.chat.id;
    const message = rankService.formatRanksByCategory();

    safeSendMessage(bot, chatId, message);
  });
}
