/**
 * Абстракция для Telegram API
 * Позволяет изолировать бизнес-логику от конкретной реализации Telegram библиотеки
 * @interface ITelegramAdapter
 */
export class ITelegramAdapter {
  /**
   * Отправить сообщение
   * @param {number|string} chatId - ID чата
   * @param {string} text - Текст сообщения
   * @param {Object} options - Дополнительные опции (parse_mode, reply_markup и т.д.)
   * @returns {Promise<Object|null>} Результат отправки или null при ошибке
   */
  async sendMessage(chatId, text, options = {}) {
    throw new Error('sendMessage must be implemented');
  }

  /**
   * Отправить реакцию на сообщение
   * @param {number|string} chatId - ID чата
   * @param {number} messageId - ID сообщения
   * @param {string} emoji - Эмодзи реакции
   * @returns {Promise<Object|null>} Результат отправки или null при ошибке
   */
  async setMessageReaction(chatId, messageId, emoji) {
    throw new Error('setMessageReaction must be implemented');
  }

  /**
   * Получить информацию о чате
   * @param {number|string} chatId - ID чата
   * @returns {Promise<Object|null>} Информация о чате или null при ошибке
   */
  async getChat(chatId) {
    throw new Error('getChat must be implemented');
  }

  /**
   * Получить список администраторов чата
   * @param {number|string} chatId - ID чата
   * @returns {Promise<Array>} Список администраторов
   */
  async getChatAdministrators(chatId) {
    throw new Error('getChatAdministrators must be implemented');
  }

  /**
   * Удалить сообщение
   * @param {number|string} chatId - ID чата
   * @param {number} messageId - ID сообщения
   * @returns {Promise<boolean>} Успешность удаления
   */
  async deleteMessage(chatId, messageId) {
    throw new Error('deleteMessage must be implemented');
  }

  /**
   * Запустить polling для получения обновлений
   * @param {Object} options - Опции polling
   * @returns {Promise<void>}
   */
  async startPolling(options = {}) {
    throw new Error('startPolling must be implemented');
  }

  /**
   * Остановить polling
   * @returns {Promise<void>}
   */
  async stopPolling() {
    throw new Error('stopPolling must be implemented');
  }

  /**
   * Подписаться на событие
   * @param {string} eventType - Тип события (message, callback_query и т.д.)
   * @param {Function} handler - Обработчик события
   */
  on(eventType, handler) {
    throw new Error('on must be implemented');
  }

  /**
   * Отписаться от события
   * @param {string} eventType - Тип события
   * @param {Function} handler - Обработчик события
   */
  off(eventType, handler) {
    throw new Error('off must be implemented');
  }

  /**
   * Получить экземпляр бота (для совместимости)
   * @returns {Object} Экземпляр бота
   */
  getBotInstance() {
    throw new Error('getBotInstance must be implemented');
  }
}
