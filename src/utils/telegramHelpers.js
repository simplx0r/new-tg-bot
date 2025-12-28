/**
 * Утилитарные функции для работы с Telegram API
 */

/**
 * Безопасная отправка сообщения с обработкой ошибок
 * @param {Object} bot - Telegram bot instance
 * @param {number|string} chatId - ID чата
 * @param {string} text - Текст сообщения
 * @param {Object} options - Дополнительные опции
 * @returns {Promise<Object|null>} - Результат отправки или null при ошибке
 */
export async function safeSendMessage(bot, chatId, text, options = {}) {
  try {
    return await bot.sendMessage(chatId, text, options);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    return null;
  }
}

/**
 * Получить ID топика из сообщения
 * @param {Object} message - Объект сообщения от Telegram
 * @returns {number|null} - ID топика или null, если это не топик
 */
export function getTopicId(message) {
  return message.message_thread_id || null;
}

/**
 * Отправить сообщение в топик с обработкой ошибок
 * @param {Object} telegramAdapter - Адаптер Telegram API
 * @param {number|string} chatId - ID чата
 * @param {number} threadId - ID топика
 * @param {string} text - Текст сообщения
 * @param {Object} options - Дополнительные опции
 * @returns {Promise<Object|null>} - Результат отправки или null при ошибке
 */
export async function sendToTopic(telegramAdapter, chatId, threadId, text, options = {}) {
  return telegramAdapter.sendMessage(chatId, text, {
    ...options,
    message_thread_id: threadId,
  });
}
