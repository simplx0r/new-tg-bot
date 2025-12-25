import { COMMANDS } from '../constants/index.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

export function setupStatsCommand(bot, statsService) {
  // Команда /stats
  bot.onText(new RegExp(`^${COMMANDS.STATS}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const userStats = statsService.getUserStats(userId, chatId);
    const message = statsService.formatUserStats(userStats);

    safeSendMessage(bot, chatId, message);
  });
}

export function setupTopCommand(bot, statsService) {
  // Команда /top
  bot.onText(/^\/top(?:\s+(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const limit = match[1] ? Number(match[1]) : 10;

    const topUsers = statsService.getTopUsers(chatId, limit);
    const message = statsService.formatTopUsers(topUsers);

    safeSendMessage(bot, chatId, message);
  });
}

export function setupAllStatsCommand(bot, statsService) {
  // Команда /allstats
  bot.onText(new RegExp(`^${COMMANDS.ALL_STATS}$`), (msg) => {
    const chatId = msg.chat.id;

    const allStats = statsService.getAllChatStats(chatId);
    const message = statsService.formatAllStats(allStats);

    safeSendMessage(bot, chatId, message);
  });
}

export function setupSummaryCommand(bot, statsService) {
  // Команда /summary
  bot.onText(new RegExp(`^${COMMANDS.SUMMARY}$`), (msg) => {
    const chatId = msg.chat.id;

    const message = statsService.formatChatSummary(chatId);
    safeSendMessage(bot, chatId, message);
  });
}
