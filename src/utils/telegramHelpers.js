/**
 * Утилитарные функции для работы с Telegram API
 */

/**
 * Безопасная отправка сообщения с обработкой ошибок
 * @param {Object} bot - Экземпляр бота
 * @param {number|string} chatId - ID чата
 * @param {string} text - Текст сообщения
 * @param {Object} options - Дополнительные опции (можно указать message_thread_id для отправки в топик)
 * @returns {Promise<Object|null>} - Результат отправки или null при ошибке
 *
 * @example
 * // Отправить в основной чат
 * await safeSendMessage(bot, chatId, 'Привет!');
 *
 * @example
 * // Отправить в топик с ID 123
 * await safeSendMessage(bot, chatId, 'Привет в топик!', { message_thread_id: 123 });
 */
export async function safeSendMessage(bot, chatId, text, options = {}) {
  try {
    return await bot.sendMessage(chatId, text, options);
  } catch (error) {
    // Игнорируем ошибки закрытых тем и других не критичных ошибок
    if (error.code === 'ETELEGRAM') {
      const errorCode = error.response?.body?.error_code;
      const description = error.response?.body?.description;

      // TOPIC_CLOSED - тема закрыта, не можем отправить сообщение
      if (description?.includes('TOPIC_CLOSED')) {
        const threadId = options.message_thread_id ? ` (топик ${options.message_thread_id})` : '';
        console.warn(`⚠️ Невозможно отправить сообщение в чат ${chatId}${threadId}: тема закрыта`);
        return null;
      }

      // USER_DEACTIVATED - пользователь деактивирован
      if (description?.includes('USER_DEACTIVATED')) {
        console.warn(`⚠️ Невозможно отправить сообщение пользователю: аккаунт деактивирован`);
        return null;
      }

      // CHAT_WRITE_FORBIDDEN - нет прав на запись в чат
      if (description?.includes('CHAT_WRITE_FORBIDDEN')) {
        console.warn(`⚠️ Нет прав на запись в чат ${chatId}`);
        return null;
      }

      // BOT_BLOCKED - бот заблокирован пользователем
      if (description?.includes('BOT_BLOCKED')) {
        console.warn(`⚠️ Бот заблокирован пользователем`);
        return null;
      }

      // PEER_FLOOD - слишком много сообщений
      if (description?.includes('PEER_FLOOD')) {
        console.warn(`⚠️ Слишком много сообщений в чат ${chatId}, попробуйте позже`);
        return null;
      }

      // BAD REQUEST - общая ошибка
      if (errorCode === 400) {
        console.warn(`⚠️ Bad Request в чат ${chatId}: ${description}`);
        return null;
      }
    }

    // Для остальных ошибок логируем, но не крашим приложение
    console.error(`❌ Ошибка отправки сообщения в чат ${chatId}:`, error.message);
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
 * @param {Object} bot - Экземпляр бота
 * @param {number|string} chatId - ID чата
 * @param {number} threadId - ID топика
 * @param {string} text - Текст сообщения
 * @param {Object} options - Дополнительные опции
 * @returns {Promise<Object|null>} - Результат отправки или null при ошибке
 */
export async function sendToTopic(bot, chatId, threadId, text, options = {}) {
  return safeSendMessage(bot, chatId, text, {
    ...options,
    message_thread_id: threadId,
  });
}
