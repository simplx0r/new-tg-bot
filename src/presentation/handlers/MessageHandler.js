import { MiddlewarePresets } from '../../infrastructure/middleware/Middleware.js';

export class MessageHandler {
  constructor(recordMessageUseCase, calculateRankUseCase, reactionService, userRepository) {
    this.recordMessageUseCase = recordMessageUseCase;
    this.calculateRankUseCase = calculateRankUseCase;
    this.reactionService = reactionService;
    this.userRepository = userRepository;

    // Создаем пайплайн middleware для обработки сообщений
    this.middlewarePipeline = MiddlewarePresets.messagePipeline(userRepository);
  }

  /**
   * Обработчик сообщений с использованием middleware
   * @param {Object} msg - Сообщение от Telegram
   * @param {Object} bot - Экземпляр бота
   */
  async handle(msg, bot) {
    const context = {
      message: msg,
      bot,
      reply: null,
      user: null,
      metadata: null,
    };

    // Определяем финальный обработчик
    const handler = async (ctx) => {
      await this.processMessage(ctx);

      // Если middleware установил ответ, отправляем его
      if (ctx.reply && ctx.bot) {
        await ctx.bot.sendMessage(ctx.message.chat.id, ctx.reply.text);
      }
    };

    // Выполняем пайплайн middleware
    await this.middlewarePipeline.execute(context, handler);
  }

  /**
   * Основная логика обработки сообщения
   * @param {Object} context - Контекст выполнения
   */
  async processMessage(context) {
    const { message, bot } = context;

    // Record message
    const { user, stats } = await this.recordMessageUseCase.execute(message.from, message.chat.id);

    // Calculate and check rank
    await this.calculateRankUseCase.execute(user.id, message.chat.id, stats.messageCount);

    // Send reaction
    if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
      await this.reactionService.sendRandomReaction(bot, message.chat.id);
    }
  }
}
