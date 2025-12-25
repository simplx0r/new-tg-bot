import TelegramBot from 'node-telegram-bot-api';
import config from './config/index.js';
import { CHAT_TYPES, EMOJI } from './constants/index.js';
import { Container } from './infrastructure/di/Container.js';
import { configureContainer } from './infrastructure/di/config.js';
import { getTopicId } from './utils/telegramHelpers.js';

class JokeBot {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.container = new Container();
    this.intervals = new Map();
    this.chatThreads = new Map(); // Храним threadId для каждого чата

    this.initialize();
  }

  /**
   * Безопасная отправка сообщения с обработкой ошибок
   * @param {number|string} chatId - ID чата
   * @param {string} text - Текст сообщения
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<Object|null>} - Результат отправки или null при ошибке
   */
  async safeSendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, options);
    } catch (error) {
      // Игнорируем ошибки закрытых тем и других не критичных ошибок
      if (error.code === 'ETELEGRAM') {
        const errorCode = error.response?.body?.error_code;
        const description = error.response?.body?.description;

        // TOPIC_CLOSED - тема закрыта, не можем отправить сообщение
        if (description?.includes('TOPIC_CLOSED')) {
          console.warn(`⚠️ Невозможно отправить сообщение в чат ${chatId}: тема закрыта`);
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
      }

      // Для остальных ошибок логируем, но не крашим приложение
      console.error(`❌ Ошибка отправки сообщения в чат ${chatId}:`, error.message);
      return null;
    }
  }

  async initialize() {
    try {
      // Configure DI container
      configureContainer(this.container, config);
      console.log('✅ DI контейнер настроен');

      // Get services from container
      const eventDispatcher = this.container.get('eventDispatcher');
      const messageHandler = this.container.get('messageHandler');

      // Setup event listeners
      this.setupEventListeners(eventDispatcher);
      console.log('✅ Слушатели событий настроены');

      // Setup bot handlers
      this.setupBotHandlers(messageHandler);
      console.log('✅ Обработчики бота настроены');

      // Setup auto jokes
      this.setupAutoJokes();
      console.log('✅ Автоматические шутки настроены');

      // Error handling
      this.bot.on('polling_error', (error) => {
        console.error('❌ Polling error:', error);
      });

      // Глобальный обработчик ошибок для всех событий бота
      this.setupGlobalErrorHandler();

      console.log('🚀 Бот запущен и готов к работе!');
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      process.exit(1);
    }
  }

  setupEventListeners(eventDispatcher) {
    // Rank earned event
    eventDispatcher.on('rank.earned', async (payload) => {
      const { userId, rank, chatId, threadId } = payload;
      const user = await this.container.get('userRepository').getById(userId);

      if (user) {
        const message = `${EMOJI.SPARKLES} Поздравляем ${user.displayName()}! ${rank.emoji}\n\n`
          + `Вы получили новое звание: ${rank.name}!\n`
          + `${rank.description || ''}`;

        const effectiveThreadId = threadId || this.defaultTopicId;
        const options = effectiveThreadId ? { message_thread_id: effectiveThreadId } : {};
        await this.safeSendMessage(chatId, message, options);
      }
    });

    // Joke sent event
    eventDispatcher.on('joke.sent', async (payload) => {
      const { joke, chatId, threadId } = payload;
      const message = `${EMOJI.LAUGH} ${joke.content}`;
      const effectiveThreadId = threadId || this.defaultTopicId;
      const options = effectiveThreadId ? { message_thread_id: effectiveThreadId } : {};
      await this.safeSendMessage(chatId, message, options);
    });

    // Message recorded event
    eventDispatcher.on('message.recorded', async (payload) => {
      const { user, stats, chatId } = payload;
      console.log(`📊 Сообщение записано: ${user.displayName()} (${stats.messageCount})`);
    });
  }

  setupBotHandlers(messageHandler) {
    // Message handler
    this.bot.on('message', (msg) => {
      messageHandler.handle(msg, this.bot).catch((error) => {
        console.error('Ошибка обработки сообщения:', error);
      });
    });

    // New chat members handler
    this.bot.on('new_chat_members', async (msg) => {
      const chatId = msg.chat.id;
      const threadId = getTopicId(msg);
      const newMembers = msg.new_chat_members;

      for (const member of newMembers) {
        await this.container.get('userRepository').getOrCreate(member);
        const welcomeMessage = `${EMOJI.SPARKLES} Добро пожаловать, ${member.first_name}!`;
        const effectiveThreadId = threadId || this.defaultTopicId;
        const options = effectiveThreadId ? { message_thread_id: effectiveThreadId } : {};
        await this.safeSendMessage(chatId, welcomeMessage, options);
      }
    });

    // Left chat member handler
    this.bot.on('left_chat_member', async (msg) => {
      const chatId = msg.chat.id;
      const threadId = getTopicId(msg);
      const member = msg.left_chat_member;

      const goodbyeMessage = `${EMOJI.USER} ${member.first_name} покинул(а) чат`;
      const effectiveThreadId = threadId || this.defaultTopicId;
      const options = effectiveThreadId ? { message_thread_id: effectiveThreadId } : {};
      await this.safeSendMessage(chatId, goodbyeMessage, options);
    });
  }

  /**
   * Глобальный обработчик ошибок для Telegram API
   */
  setupGlobalErrorHandler() {
    // Обработка необработанных ошибок в асинхронных операциях
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      // Не завершаем процесс, логируем и продолжаем работу
    });

    // Логирование всех ошибок бота
    this.bot.on('error', (error) => {
      console.error('❌ Bot error:', error);
    });
  }

  setupAutoJokes() {
    this.bot.on('message', (msg) => {
      if (msg.chat.type === CHAT_TYPES.GROUP || msg.chat.type === CHAT_TYPES.SUPERGROUP) {
        const chatId = msg.chat.id;
        const threadId = getTopicId(msg);

        // Сохраняем threadId для этого чата
        if (threadId) {
          this.chatThreads.set(chatId, threadId);
        }

        // If interval already running, skip
        if (this.intervals.has(chatId)) {
          return;
        }

        // Get chat settings
        const settings = this.container.get('chatSettingsRepository').getOrCreate(chatId);

        if (settings.jokesEnabled) {
          this.startAutoJokesForChat(chatId, settings.jokesInterval);
        }
      }
    });
  }

  startAutoJokesForChat(chatId, intervalMinutes) {
    const intervalMs = intervalMinutes * 60 * 1000;

    const intervalId = setInterval(async () => {
      const settings = this.container.get('chatSettingsRepository').getOrCreate(chatId);

      if (!settings.jokesEnabled) {
        this.stopAutoJokesForChat(chatId);
        return;
      }

      try {
        const threadId = this.chatThreads.get(chatId) || null;
        await this.container.get('sendJokeUseCase').execute(chatId, null, threadId);
      } catch (error) {
        console.error(`Ошибка отправки шутки в чат ${chatId}:`, error);
      }
    }, intervalMs);

    this.intervals.set(chatId, intervalId);
    console.log(`📅 Авто-шутки запущены для чата ${chatId} (интервал: ${intervalMinutes} мин)`);
  }

  stopAutoJokesForChat(chatId) {
    const intervalId = this.intervals.get(chatId);

    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(chatId);
      this.chatThreads.delete(chatId); // Удаляем threadId чата
      console.log(`⏸️ Авто-шутки остановлены для чата ${chatId}`);
    }
  }

  stop() {
    // Stop all intervals
    this.intervals.forEach((intervalId, chatId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.chatThreads.clear(); // Очищаем threadId для всех чатов

    // Stop bot
    this.bot.stopPolling();

    // Close database
    const db = this.container.get('db');
    if (db) {
      db.close();
    }

    console.log('👋 Бот остановлен');
  }
}

// Start bot
const bot = new JokeBot();

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  bot.stop();
  process.exit(0);
});

export default JokeBot;

