import { COMMANDS, EMOJI } from '../constants/index.js';
import { isValidInterval } from '../utils/validators.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

export function setupTopicsCommand(bot, db) {
  // Команда /topics (только для админов)
  bot.onText(new RegExp(`^${COMMANDS.TOPICS}$`), async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    try {
      // Получаем список топиков в чате
      const topics = await bot.getForumTopic(chatId);

      if (!topics || topics.length === 0) {
        safeSendMessage(bot, chatId, `${EMOJI.EYE} В этом чате нет топиков`);
        return;
      }

      // Формируем сообщение со списком топиков
      let message = `${EMOJI.FOLDER} Топики в чате:\n\n`;
      topics.forEach((topic, index) => {
        message += `${index + 1}. 📌 ${topic.name}\n`;
        message += `   ID: ${topic.message_thread_id}\n\n`;
      });

      safeSendMessage(bot, chatId, message);
    } catch (error) {
      console.error('Ошибка получения списка топиков:', error);
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Не удалось получить список топиков`);
    }
  });
}

export function setupJokesOnCommand(bot, db) {
  // Команда /jokeson (только для админов)
  bot.onText(new RegExp(`^${COMMANDS.JOKES_ON}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    db.updateChatSettings(chatId, { jokesEnabled: true });
    safeSendMessage(bot, chatId, `${EMOJI.CHECK} Автоматические шутки включены`);
  });
}

export function setupJokesOffCommand(bot, db) {
  // Команда /jokesoff (только для админов)
  bot.onText(new RegExp(`^${COMMANDS.JOKES_OFF}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    db.updateChatSettings(chatId, { jokesEnabled: false });
    safeSendMessage(bot, chatId, `${EMOJI.CHECK} Автоматические шутки выключены`);
  });
}

export function setupSetIntervalCommand(bot, db) {
  // Команда /setinterval (только для админов)
  bot.onText(/^\/setinterval\s+(\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const interval = Number(match[1]);

    if (!isValidInterval(interval)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Интервал должен быть не менее 1 минуты`);
      return;
    }

    db.updateChatSettings(chatId, { jokesInterval: interval });
    safeSendMessage(bot, chatId, `${EMOJI.CHECK} Интервал установлен на ${interval} минут(ы)`);
  });
}

export function setupAddAdminCommand(bot, db) {
  // Команда /addadmin (только для админов)
  bot.onText(/^\/addadmin\s+(\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const targetUserId = Number(match[1]);
    db.addAdmin(targetUserId, userId);

    safeSendMessage(bot, chatId, `${EMOJI.CHECK} Пользователь ${targetUserId} добавлен в админы`);
  });
}

export function setupRemoveAdminCommand(bot, db) {
  // Команда /removeadmin (только для админов)
  bot.onText(/^\/removeadmin\s+(\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const targetUserId = Number(match[1]);
    db.removeAdmin(targetUserId);

    safeSendMessage(bot, chatId, `${EMOJI.CHECK} Пользователь ${targetUserId} удалён из админов`);
  });
}

export function setupAdminsCommand(bot, db) {
  // Команда /admins (только для админов)
  bot.onText(new RegExp(`^${COMMANDS.ADMINS}$`), (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!db.isAdmin(userId)) {
      safeSendMessage(bot, chatId, `${EMOJI.CROSS} Эта команда доступна только админам`);
      return;
    }

    const admins = db.getAllAdmins();

    if (admins.length === 0) {
      safeSendMessage(bot, chatId, `${EMOJI.EYE} Список админов пуст`);
      return;
    }

    let message = `${EMOJI.AGENT} Список админов:\n\n`;
    admins.forEach((admin, index) => {
      message += `${index + 1}. ID: ${admin.telegram_id}\n`;
    });

    safeSendMessage(bot, chatId, message);
  });
}
