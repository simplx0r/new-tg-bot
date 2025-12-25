import { setupStartCommand } from './startCommand.js';
import { setupHelpCommand } from './helpCommand.js';
import {
  setupAddJokeCommand,
  setupJokeCommands,
  setupJokeStatsCommand,
  setupJokesCommand,
} from './jokeCommands.js';
import {
  setupAllStatsCommand,
  setupStatsCommand,
  setupSummaryCommand,
  setupTopCommand,
} from './statsCommands.js';
import {
  setupRankCommand,
  setupRanksCommand,
} from './rankCommands.js';
import {
  setupAddAdminCommand,
  setupAdminsCommand,
  setupJokesOffCommand,
  setupJokesOnCommand,
  setupRemoveAdminCommand,
  setupSetIntervalCommand,
} from './adminCommands.js';
import { setupNotifyCommand } from './notificationCommands.js';
import {
  MiddlewarePresets,
  adminOnlyMiddleware,
} from '../infrastructure/middleware/Middleware.js';

class Commands {
  constructor(bot, db, jokeService, statsService, rankService, notificationService, userRepository) {
    this.bot = bot;
    this.db = db;
    this.jokeService = jokeService;
    this.statsService = statsService;
    this.rankService = rankService;
    this.notificationService = notificationService;
    this.userRepository = userRepository;

    this.setupAllCommands();
  }

  setupAllCommands() {
    // Основные команды
    setupStartCommand(this.bot);
    setupHelpCommand(this.bot);

    // Команды шуток
    setupJokeCommands(this.bot, this.jokeService);
    setupAddJokeCommand(this.bot, this.db, this.jokeService);
    setupJokesCommand(this.bot, this.db, this.jokeService);
    setupJokeStatsCommand(this.bot, this.db, this.jokeService);

    // Команды статистики
    setupStatsCommand(this.bot, this.statsService);
    setupTopCommand(this.bot, this.statsService);
    setupAllStatsCommand(this.bot, this.statsService);
    setupSummaryCommand(this.bot, this.statsService);

    // Команды званий
    setupRankCommand(this.bot, this.db, this.statsService, this.rankService);
    setupRanksCommand(this.bot, this.rankService);

    // Админские команды
    setupJokesOnCommand(this.bot, this.db);
    setupJokesOffCommand(this.bot, this.db);
    setupSetIntervalCommand(this.bot, this.db);
    setupAddAdminCommand(this.bot, this.db);
    setupRemoveAdminCommand(this.bot, this.db);
    setupAdminsCommand(this.bot, this.db);

    // Команды уведомлений
    setupNotifyCommand(this.bot, this.db, this.notificationService);
  }

  /**
   * Создать обертку для команды с middleware
   * @param {string} command - Команда
   * @param {Function} handler - Обработчик команды
   * @param {Array} middlewares - Массив middleware функций
   */
  createCommand(command, handler, middlewares = []) {
    const pipeline = MiddlewarePresets.messagePipeline(this.userRepository);

    // Добавляем дополнительные middleware
    middlewares.forEach((mw) => {
      pipeline.use(mw);
    });

    this.bot.onText(new RegExp(`^${command}$`), async (msg, match) => {
      const context = {
        message: msg,
        bot: this.bot,
        match,
        reply: null,
        user: null,
        metadata: null,
      };

      // Определяем финальный обработчик
      const finalHandler = async (ctx) => {
        await handler(ctx);

        // Если middleware установил ответ, отправляем его
        if (ctx.reply && ctx.bot) {
          await ctx.bot.sendMessage(ctx.message.chat.id, ctx.reply.text);
        }
      };

      // Выполняем пайплайн middleware
      await pipeline.execute(context, finalHandler);
    });
  }

  /**
   * Создать обертку для админской команды
   * @param {string} command - Команда
   * @param {Function} handler - Обработчик команды
   */
  createAdminCommand(command, handler) {
    this.createCommand(command, handler, [
      adminOnlyMiddleware(this.userRepository),
    ]);
  }
}

export default Commands;

