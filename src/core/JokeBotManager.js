import { EMOJI } from '../constants/index.js';
import { JokeSentEvent, MessageRecordedEvent, RankEarnedEvent } from '../domain/events/TypedEvent.js';
import { logger } from '../infrastructure/logging/Logger.js';
import { getTopicId } from '../utils/telegramHelpers.js';
import Commands from '../commands/index.js';

/**
 * Менеджер жизненного цикла бота
 * Координирует все компоненты бота и управляет его состоянием
 */
export class JokeBotManager {
  /**
   * @param {Object} container - DI контейнер
   */
  constructor(container) {
    this.container = container;
    this.isRunning = false;

    // Получаем сервисы из контейнера
    this.telegramAdapter = container.get('telegramAdapter');
    this.eventDispatcher = container.get('eventDispatcher');
    this.scheduler = container.get('scheduler');
    this.errorHandler = container.get('errorHandler');
    this.metricsCollector = container.get('metricsCollector');
    this.cacheService = container.get('cacheService');
    this.messageHandler = container.get('messageHandler');

    // Хранилище состояния
    this.chatThreads = new Map(); // Храним threadId для каждого чата
    this.activeAutoJokes = new Map(); // Активные авто-шутки по chatId

    // Инициализируем команды (но не регистрируем их, пока бот не запущен)
    this.commands = null;
  }

  /**
   * Запустить бота
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      logger.info('Starting bot...');

      // Запускаем Telegram polling
      await this.telegramAdapter.startPolling();

      // Настраиваем обработчики событий
      this._setupEventListeners();

      // Настраиваем обработчики Telegram
      this._setupTelegramHandlers();

      // Настраиваем команды
      this._setupCommands();

      // Запускаем планировщик
      this.scheduler.start();

      this.isRunning = true;

      // Отправляем метрику запуска
      this.metricsCollector.increment('bot.start');

      logger.info('🚀 Bot started successfully');
    } catch (error) {
      await this.errorHandler.handle(error, { context: 'start' });
      throw error;
    }
  }

  /**
   * Остановить бота
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('Bot is not running');
      return;
    }

    try {
      logger.info('Stopping bot...');

      // Останавливаем все авто-шутки
      this.activeAutoJokes.forEach((_, chatId) => {
        this.stopAutoJokesForChat(chatId);
      });

      // Останавливаем планировщик
      this.scheduler.stop();

      // Останавливаем Telegram polling
      await this.telegramAdapter.stopPolling();

      // Закрываем базу данных
      const db = this.container.get('db');
      if (db && typeof db.close === 'function') {
        db.close();
      }

      // Очищаем кэш
      this.cacheService.clear();

      this.isRunning = false;

      // Отправляем метрику остановки
      this.metricsCollector.increment('bot.stop');

      logger.info('👋 Bot stopped successfully');
    } catch (error) {
      await this.errorHandler.handle(error, { context: 'stop' });
      throw error;
    }
  }

  /**
   * Настроить слушатели доменных событий
   * @private
   */
  _setupEventListeners() {
    // Обработка события записи сообщения
    this.eventDispatcher.on(MessageRecordedEvent.name, async (event) => {
      logger.debug(`Message recorded: ${event.payload.user.displayName()} (${event.payload.stats.messageCount})`);
    });

    // Обработка события отправки шутки
    this.eventDispatcher.on(JokeSentEvent.name, async (event) => {
      const { joke, chatId, threadId } = event.payload;
      const message = `${EMOJI.LAUGH} ${joke.content}`;
      const options = threadId ? { message_thread_id: threadId } : {};

      await this.telegramAdapter.sendMessage(chatId, message, options);
      this.metricsCollector.increment('jokes.sent');
    });

    // Обработка события получения звания
    this.eventDispatcher.on(RankEarnedEvent.name, async (event) => {
      const { userId, rank, chatId, threadId } = event.payload;
      const userRepository = this.container.get('userRepository');
      const user = await userRepository.getById(userId);

      if (user) {
        const message = `${EMOJI.SPARKLES} Поздравляем ${user.displayName()}! ${rank.emoji}\n\n`
          + `Вы получили новое звание: ${rank.name}!\n`
          + `${rank.description || ''}`;

        const options = threadId ? { message_thread_id: threadId } : {};
        await this.telegramAdapter.sendMessage(chatId, message, options);
        this.metricsCollector.increment('ranks.earned');
      }
    });

    // Обработка ошибок
    this.eventDispatcher.on('error.occurred', async (event) => {
      const { error, metadata } = event.payload;
      logger.error('Error occurred', error, { severity: metadata?.severity, category: metadata?.category });
    });
  }

  /**
   * Настроить обработчики Telegram событий
   * @private
   */
  _setupTelegramHandlers() {
    // Обработка сообщений
    this.telegramAdapter.on('message', async (msg) => {
      await this.metricsCollector.measure('message.handle', async () => {
        await this.messageHandler.handle(msg, this.telegramAdapter);
      });
    });

    // Обработка новых участников чата
    this.telegramAdapter.on('new_chat_members', async (msg) => {
      await this._handleNewChatMembers(msg);
    });

    // Обработка выхода участника из чата
    this.telegramAdapter.on('left_chat_member', async (msg) => {
      await this._handleLeftChatMember(msg);
    });

    // Обработка ошибок polling
    this.telegramAdapter.on('polling_error', async (error) => {
      await this.errorHandler.handle(error, { context: 'polling' });
    });

    // Обработка всех ошибок
    this.telegramAdapter.on('error', async (error) => {
      await this.errorHandler.handle(error, { context: 'telegram' });
    });
  }

  /**
   * Настроить команды бота
   * @private
   */
  _setupCommands() {
    const db = this.container.get('db');
    const jokeService = this.container.get('jokeService');
    const statsService = this.container.get('statsService');
    const rankService = this.container.get('rankService');
    const notificationService = this.container.get('notificationService');
    const userRepository = this.container.get('userRepository');
    const bot = this.telegramAdapter.getBotInstance();

    this.commands = new Commands(bot, db, jokeService, statsService, rankService, notificationService, userRepository);
    logger.info('📝 Bot commands registered');
  }

  /**
   * Обработать новых участников чата
   * @private
   * @param {Object} msg - Сообщение от Telegram
   */
  async _handleNewChatMembers(msg) {
    const chatId = msg.chat.id;
    const threadId = getTopicId(msg);
    const newMembers = msg.new_chat_members;

    for (const member of newMembers) {
      const userRepository = this.container.get('userRepository');
      await userRepository.getOrCreate(member);

      const welcomeMessage = `${EMOJI.SPARKLES} Добро пожаловать, ${member.first_name}!`;
      const options = threadId ? { message_thread_id: threadId } : {};

      await this.telegramAdapter.sendMessage(chatId, welcomeMessage, options);
      this.metricsCollector.increment('chat.members.new');
    }
  }

  /**
   * Обработать выход участника из чата
   * @private
   * @param {Object} msg - Сообщение от Telegram
   */
  async _handleLeftChatMember(msg) {
    const chatId = msg.chat.id;
    const threadId = getTopicId(msg);
    const member = msg.left_chat_member;

    const goodbyeMessage = `${EMOJI.USER} ${member.first_name} покинул(а) чат`;
    const options = threadId ? { message_thread_id: threadId } : {};

    await this.telegramAdapter.sendMessage(chatId, goodbyeMessage, options);
    this.metricsCollector.increment('chat.members.left');
  }

  /**
   * Запустить авто-шутки для чата
   * @param {number} chatId - ID чата
   * @param {number} intervalMinutes - Интервал в минутах
   */
  startAutoJokesForChat(chatId, intervalMinutes) {
    const taskId = `autojokes:${chatId}`;

    if (this.activeAutoJokes.has(chatId)) {
      logger.warn(`Auto jokes already active for chat ${chatId}`);
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    this.scheduler.scheduleInterval(taskId, async () => {
      const chatSettingsRepository = this.container.get('chatSettingsRepository');
      const settings = chatSettingsRepository.getOrCreate(chatId);

      if (!settings.jokesEnabled) {
        this.stopAutoJokesForChat(chatId);
        return;
      }

      try {
        const threadId = this.chatThreads.get(chatId) || null;
        await this.container.get('sendJokeUseCase').execute(chatId, null, threadId);
      } catch (error) {
        await this.errorHandler.handle(error, { context: 'autojokes', chatId });
      }
    }, intervalMs);

    this.activeAutoJokes.set(chatId, taskId);
    this.metricsCollector.increment('autojokes.started');
    logger.info(`📅 Auto jokes started for chat ${chatId} (interval: ${intervalMinutes} min)`);
  }

  /**
   * Остановить авто-шутки для чата
   * @param {number} chatId - ID чата
   */
  stopAutoJokesForChat(chatId) {
    const taskId = `autojokes:${chatId}`;

    if (this.scheduler.cancel(taskId)) {
      this.activeAutoJokes.delete(chatId);
      this.chatThreads.delete(chatId);
      this.metricsCollector.increment('autojokes.stopped');
      logger.info(`⏸️ Auto jokes stopped for chat ${chatId}`);
    }
  }

  /**
   * Проверить и запустить авто-шутки для чата
   * @param {number} chatId - ID чата
   * @param {number} threadId - ID темы
   */
  async checkAndStartAutoJokes(chatId, threadId) {
    // Сохраняем threadId для этого чата
    if (threadId) {
      this.chatThreads.set(chatId, threadId);
    }

    // Если авто-шутки уже запущены, пропускаем
    if (this.activeAutoJokes.has(chatId)) {
      return;
    }

    const chatSettingsRepository = this.container.get('chatSettingsRepository');
    const settings = chatSettingsRepository.getOrCreate(chatId);

    if (settings.jokesEnabled) {
      this.startAutoJokesForChat(chatId, settings.jokesInterval);
    }
  }

  /**
   * Получить статистику бота
   * @returns {Object} Статистика
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      activeAutoJokes: this.activeAutoJokes.size,
      cacheStats: this.cacheService.getStats(),
      metrics: this.metricsCollector.getAllMetrics(),
      schedulerTasks: this.scheduler.getAllTasks(),
    };
  }
}

export default JokeBotManager;
