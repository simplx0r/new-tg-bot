import { EMOJI } from '../constants/index.js';
import { createBoldText, createSpoilerText } from '../utils/formatters.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

class NotificationService {
  constructor(db) {
    this.db = db;
  }

  recordNotification(chatId, message, sentBy) {
    return this.db.recordNotification(chatId, message, sentBy);
  }

  getNotificationHistory(chatId, limit = 10) {
    return this.db.getNotificationHistory(chatId, limit);
  }

  async sendNotification(bot, chatId, message, sentBy, useSpoiler = false) {
    const content = useSpoiler ? createSpoilerText(message) : message;

    const sentMessage = await safeSendMessage(bot, chatId, content, {
      parseMode: 'HTML',
    });

    if (sentMessage) {
      this.recordNotification(chatId, message, sentBy);
    }

    return sentMessage;
  }

  async sendNotificationToAll(bot, chatId, message, sentBy, useSpoiler = false) {
    const content = useSpoiler ? createSpoilerText(message) : message;
    const header = `${EMOJI.BELL} ${createBoldText('Важное уведомление')}\n\n`;
    const fullMessage = header + content;

    const sentMessage = await safeSendMessage(bot, chatId, fullMessage, {
      parseMode: 'HTML',
    });

    if (sentMessage) {
      this.recordNotification(chatId, message, sentBy);
    }

    return sentMessage;
  }

  formatNotificationHistory(notifications) {
    if (notifications.length === 0) {
      return `${EMOJI.EYE} История уведомлений пуста`;
    }

    let message = `${EMOJI.EYE} История уведомлений:\n\n`;

    notifications.forEach((notif, index) => {
      const preview = notif.message.length > 50
        ? `${notif.message.substring(0, 50)}...`
        : notif.message;
      const date = new Date(notif.sent_at).toLocaleString('ru-RU');
      message += `${index + 1}. ${preview}\n   🕐 ${date}\n   👤 От: ${notif.sent_by}\n\n`;
    });

    return message;
  }
}

export default NotificationService;
