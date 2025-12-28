import { MiddlewarePresets } from '../../infrastructure/middleware/Middleware.js';
import { getTopicId } from '../../utils/telegramHelpers.js';
import { CHAT_TYPES } from '../../constants/index.js';

/**
 * Обработчик сообщений от Telegram
 * Координирует middleware и Use Cases для обработки сообщений
 */
export class MessageHandler {
  /**
   * @param {Object} recordMessageUseCase - Use Case для записи сообщений
   * @param {Object} calculateRankUseCase - Use Case для расчёта званий
   * @param {Object} reactionService - Сервис реакций
   * @param {Object} userRepository - Репозиторий пользователей
   * @param {number} defaultTopicId - ID темы по умолчанию
   */
  constructor(recordMessageUseCase, calculateRankUseCase, reactionService, userRepository, defaultTopicId) {
    this.recordMessageUseCase = recordMessageUseCase;
    this.calculateRankUseCase = calculateRankUseCase;
    this.reactionService = reactionService;
    this.userRepository = userRepository;
    this.defaultTopicId = defaultTopicId;

    // Создаём пайплайн middleware для обработки сообщений
    this.middlewarePipeline = MiddlewarePresets.messagePipeline(userRepository);
  }

  /**
   * Обработать сообщение
   * @param {Object} msg - Сообщение от Telegram
   * @param {Object} telegramAdapter - Адаптер Telegram API
   */
  async handle(msg, telegramAdapter) {
    const context = {
      message: msg,
      telegramAdapter,
      reply: null,
      user: null,
      metadata: null,
    };

    // Определяем финальный обработчик
    const handler = async (ctx) => {
      await this.processMessage(ctx);

      // Если middleware установил ответ, отправляем его
      if (ctx.reply && ctx.telegramAdapter) {
        const threadId = getTopicId(ctx.message);
        const options = threadId ? { message_thread_id: threadId } : {};
        await ctx.telegramAdapter.sendMessage(ctx.message.chat.id, ctx.reply.text, options);
      }
    };

    // Выполняем пайплайн middleware
    await this.middlewarePipeline.execute(context, handler);
  }

  /**
   * Основная логика обработки сообщения
   * @private
   * @param {Object} context - Контекст выполнения
   */
  async processMessage(context) {
    const { message, telegramAdapter } = context;
    const threadId = getTopicId(message);

    // Record message
    const { user, stats } = await this.recordMessageUseCase.execute(message.from, message.chat.id);

    // Calculate and check rank
    await this.calculateRankUseCase.execute(user.id, message.chat.id, stats.messageCount, threadId);

    // Send reaction (только в групповых чатах)
    if (message.chat.type === CHAT_TYPES.GROUP || message.chat.type === CHAT_TYPES.SUPERGROUP) {
      const options = threadId ? { message_thread_id: threadId } : {};
      await this.reactionService.sendRandomReaction(telegramAdapter, message.chat.id, options);
    }
  }
}
