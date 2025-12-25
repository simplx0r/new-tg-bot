import { EMOJI } from '../constants/index.js';

export function setupNotifyCommand(bot, db, notificationService) {
  // Команда /notify (только для админов)
  bot.onText(/^\/notify\s+(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      bot.sendMessage(chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const messageText = match[1].trim();

    if (!messageText) {
      bot.sendMessage(chatId, `${EMOJI.CROSS} Укажите текст уведомления`);
      return;
    }

    notificationService.sendNotificationToAll(bot, chatId, messageText, userId, true);
  });
}
