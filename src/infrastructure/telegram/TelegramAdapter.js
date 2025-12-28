import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../logging/Logger.js';
import { ITelegramAdapter } from './ITelegramAdapter.js';

/**
 * Реализация адаптера для node-telegram-bot-api
 * Инкапсулирует логику работы с Telegram API
 */
export class TelegramAdapter extends ITelegramAdapter {
  /**
   * @param {string} token - Токен бота
   * @param {Object} options - Опции бота
   * @param {boolean} options.polling - Включить polling
   * @param {Object} options.webhook - Настройки webhook
   */
  constructor(token, options = {}) {
    super();
    this.bot = new TelegramBot(token, options);
    this.errorHandlers = new Map();
  }

  /**
   * Безопасная отправка сообщения с обработкой ошибок
   * @param {number|string} chatId - ID чата
   * @param {string} text - Текст сообщения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object|null>} Результат отправки или null при ошибке
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      await this._handleError(error, 'sendMessage', { chatId, text, options });
      return null;
    }
  }

  /**
   * Отправить реакцию на сообщение
   * @param {number|string} chatId - ID чата
   * @param {number} messageId - ID сообщения
   * @param {string} emoji - Эмодзи реакции
   * @returns {Promise<Object|null>} Результат отправки или null при ошибке
   */
  async setMessageReaction(chatId, messageId, emoji) {
    try {
      return await this.bot.setMessageReaction(chatId, messageId, {
        type: 'emoji',
        emoji,
      });
    } catch (error) {
      await this._handleError(error, 'setMessageReaction', { chatId, messageId, emoji });
      return null;
    }
  }

  /**
   * Получить информацию о чате
   * @param {number|string} chatId - ID чата
   * @returns {Promise<Object|null>} Информация о чате или null при ошибке
   */
  async getChat(chatId) {
    try {
      return await this.bot.getChat(chatId);
    } catch (error) {
      await this._handleError(error, 'getChat', { chatId });
      return null;
    }
  }

  /**
   * Получить список администраторов чата
   * @param {number|string} chatId - ID чата
   * @returns {Promise<Array>} Список администраторов
   */
  async getChatAdministrators(chatId) {
    try {
      return await this.bot.getChatAdministrators(chatId);
    } catch (error) {
      await this._handleError(error, 'getChatAdministrators', { chatId });
      return [];
    }
  }

  /**
   * Удалить сообщение
   * @param {number|string} chatId - ID чата
   * @param {number} messageId - ID сообщения
   * @returns {Promise<boolean>} Успешность удаления
   */
  async deleteMessage(chatId, messageId) {
    try {
      await this.bot.deleteMessage(chatId, messageId);
      return true;
    } catch (error) {
      await this._handleError(error, 'deleteMessage', { chatId, messageId });
      return false;
    }
  }

  /**
   * Запустить polling для получения обновлений
   * @param {Object} options - Опции polling
   * @returns {Promise<void>}
   */
  async startPolling(options = {}) {
    try {
      if (!this.bot.isPolling()) {
        await this.bot.startPolling(options);
        logger.info('Telegram polling started');
      }
    } catch (error) {
      logger.error('Failed to start polling', error);
      throw error;
    }
  }

  /**
   * Остановить polling
   * @returns {Promise<void>}
   */
  async stopPolling() {
    try {
      if (this.bot.isPolling()) {
        await this.bot.stopPolling();
        logger.info('Telegram polling stopped');
      }
    } catch (error) {
      logger.error('Failed to stop polling', error);
      throw error;
    }
  }

  /**
   * Подписаться на событие
   * @param {string} eventType - Тип события
   * @param {Function} handler - Обработчик события
   */
  on(eventType, handler) {
    this.bot.on(eventType, handler);
  }

  /**
   * Отписаться от события
   * @param {string} eventType - Тип события
   * @param {Function} handler - Обработчик события
   */
  off(eventType, handler) {
    this.bot.off(eventType, handler);
  }

  /**
   * Подписаться на все события (для отладки)
   * @param {string} eventType - Тип события
   * @param {Function} handler - Обработчик события
   */
  onAny(eventType, handler) {
    this.bot.on(eventType, handler);
  }

  /**
   * Получить экземпляр бота (для совместимости)
   * @returns {Object} Экземпляр бота
   */
  getBotInstance() {
    return this.bot;
  }

  /**
   * Добавить обработчик ошибок для конкретного метода
   * @param {string} method - Имя метода
   * @param {Function} handler - Обработчик ошибок
   */
  addErrorHandler(method, handler) {
    this.errorHandlers.set(method, handler);
  }

  /**
   * Удалить обработчик ошибок
   * @param {string} method - Имя метода
   */
  removeErrorHandler(method) {
    this.errorHandlers.delete(method);
  }

  /**
   * Внутренний метод обработки ошибок
   * @private
   * @param {Error} error - Ошибка
   * @param {string} method - Имя метода
   * @param {Object} context - Контекст ошибки
   */
  async _handleError(error, method, context) {
    // Проверяем, является ли ошибка критической
    const isCritical = this._isCriticalError(error);

    // Вызываем пользовательский обработчик, если есть
    const customHandler = this.errorHandlers.get(method);
    if (customHandler) {
      await customHandler(error, context);
    }

    // Логируем ошибку
    if (isCritical) {
      logger.error(`Telegram API error in ${method}`, error, { context });
    } else {
      logger.warn(`Telegram API warning in ${method}`, error.message, { context });
    }
  }

  /**
   * Проверить, является ли ошибка критической
   * @private
   * @param {Error} error - Ошибка
   * @returns {boolean} Является ли ошибка критической
   */
  _isCriticalError(error) {
    if (error.code !== 'ETELEGRAM') {
      return true;
    }

    const description = error.response?.body?.description;

    // Некритичные ошибки
    const nonCriticalErrors = [
      'TOPIC_CLOSED',
      'USER_DEACTIVATED',
      'CHAT_WRITE_FORBIDDEN',
      'BOT_BLOCKED',
      'MESSAGE_TO_DELETE_NOT_FOUND',
      'MESSAGE_NOT_MODIFIED',
      'PEER_ID_INVALID',
    ];

    return !nonCriticalErrors.some((err) => description?.includes(err));
  }
}
