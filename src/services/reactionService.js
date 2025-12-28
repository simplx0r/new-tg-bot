import { REACTION_TYPES } from '../constants/index.js';

/**
 * Сервис для работы с реакциями
 * Управляет реакциями на сообщения (стикеры, текстовые ответы)
 */
export default class ReactionService {
  /**
   * @param {Object} reactionRepository - Репозиторий реакций
   */
  constructor(reactionRepository) {
    this.reactionRepository = reactionRepository;
  }

  /**
   * Добавить реакцию
   * @param {string} triggerText - Текст-триггер
   * @param {string} reactionType - Тип реакции
   * @param {string} reactionContent - Содержимое реакции
   * @param {string} category - Категория реакции
   * @returns {Object} Созданная реакция
   */
  addReaction(triggerText, reactionType, reactionContent, category = 'general') {
    return this.reactionRepository.addReaction(triggerText, reactionType, reactionContent, category);
  }

  /**
   * Получить все реакции
   * @returns {Array} Список реакций
   */
  getAllReactions() {
    return this.reactionRepository.getAllReactions();
  }

  /**
   * Получить реакции по категории
   * @param {string} category - Категория
   * @returns {Array} Список реакций
   */
  getReactionsByCategory(category) {
    return this.reactionRepository.getReactionsByCategory(category);
  }

  /**
   * Получить случайную реакцию
   * @returns {Object|null} Случайная реакция
   */
  getRandomReaction() {
    return this.reactionRepository.getRandomReaction();
  }

  /**
   * Отправить реакцию
   * @param {Object} telegramAdapter - Адаптер Telegram API
   * @param {number} chatId - ID чата
   * @param {Object} reaction - Реакция
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object|null>} Результат отправки или null
   */
  async sendReaction(telegramAdapter, chatId, reaction, options = {}) {
    if (!reaction) {
      return null;
    }

    if (reaction.reaction_type === REACTION_TYPES.STICKER) {
      return telegramAdapter.sendMessage(chatId, reaction.reaction_content, {
        ...options,
        sticker: reaction.reaction_content,
      });
    } if (reaction.reaction_type === REACTION_TYPES.MESSAGE) {
      return telegramAdapter.sendMessage(chatId, reaction.reaction_content, options);
    }

    return null;
  }

  /**
   * Отправить случайную реакцию
   * @param {Object} telegramAdapter - Адаптер Telegram API
   * @param {number} chatId - ID чата
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object|null>} Результат отправки или null
   */
  async sendRandomReaction(telegramAdapter, chatId, options = {}) {
    const reaction = this.getRandomReaction();
    return this.sendReaction(telegramAdapter, chatId, reaction, options);
  }

  /**
   * Найти реакцию по триггеру
   * @param {string} text - Текст сообщения
   * @returns {Object|null} Найденная реакция или null
   */
  findReactionByTrigger(text) {
    const allReactions = this.getAllReactions();
    return allReactions.find((r) => text.toLowerCase().includes(r.trigger_text.toLowerCase()));
  }

  /**
   * Отправить реакцию по триггеру
   * @param {Object} telegramAdapter - Адаптер Telegram API
   * @param {number} chatId - ID чата
   * @param {string} text - Текст сообщения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object|null>} Результат отправки или null
   */
  async sendReactionByTrigger(telegramAdapter, chatId, text, options = {}) {
    const reaction = this.findReactionByTrigger(text);
    if (reaction) {
      return this.sendReaction(telegramAdapter, chatId, reaction, options);
    }
    return null;
  }
}
