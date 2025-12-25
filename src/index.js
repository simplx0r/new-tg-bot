import TelegramBot from 'node-telegram-bot-api';
import config from './config/index.js';
import { CHAT_TYPES, EMOJI } from './constants/index.js';
import { Container } from './infrastructure/di/Container.js';
import { configureContainer } from './infrastructure/di/config.js';
import { MessageHandler } from './presentation/handlers/MessageHandler.js';

class JokeBot {
  constructor() {
    this.bot = new TelegramBot(config.telegram.token, { polling: true });
    this.container = new Container();
    this.intervals = new Map();

    this.initialize();
  }

  async initialize() {
    try {
      // Configure DI container
      configureContainer(this.container, config);
      console.log('✅ DI контейнер настроен');

      // Get services from container
      const eventDispatcher = this.container.get('eventDispatcher');
      const messageHandler = new MessageHandler(
        this.container.get('recordMessageUseCase'),
        this.container.get('calculateRankUseCase'),
        this.container.get('reactionService'),
        this.container.get('userRepository')
      );

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

      console.log('🚀 Бот запущен и готов к работе!');

    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      process.exit(1);
    }
  }

  setupEventListeners(eventDispatcher) {
    // Rank earned event
    eventDispatcher.on('rank.earned', async (payload) => {
      const { userId, rank, chatId } = payload;
      const user = await this.container.get('userRepository').getById(userId);

      if (user) {
        const message = `${EMOJI.SPARKLES} Поздравляем ${user.displayName()}! ${rank.emoji}\n\n` +
          `Вы получили новое звание: ${rank.name}!\n` +
          `${rank.description || ''}`;

        await this.bot.sendMessage(chatId, message);
      }
    });

    // Joke sent event
    eventDispatcher.on('joke.sent', async (payload) => {
      const { joke, chatId } = payload;
      const message = `${EMOJI.LAUGH} ${joke.content}`;
      await this.bot.sendMessage(chatId, message);
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
      messageHandler.handle(msg, this.bot).catch(error => {
        console.error('Ошибка обработки сообщения:', error);
      });
    });

    // New chat members handler
    this.bot.on('new_chat_members', async (msg) => {
      const chatId = msg.chat.id;
      const newMembers = msg.new_chat_members;

      for (const member of newMembers) {
        await this.container.get('userRepository').getOrCreate(member);
        const welcomeMessage = `${EMOJI.SPARKLES} Добро пожаловать, ${member.first_name}!`;
        await this.bot.sendMessage(chatId, welcomeMessage);
      }
    });

    // Left chat member handler
    this.bot.on('left_chat_member', async (msg) => {
      const chatId = msg.chat.id;
      const member = msg.left_chat_member;

      const goodbyeMessage = `${EMOJI.USER} ${member.first_name} покинул(а) чат`;
      await this.bot.sendMessage(chatId, goodbyeMessage);
    });
  }

  setupAutoJokes() {
    this.bot.on('message', (msg) => {
      if (msg.chat.type === CHAT_TYPES.GROUP || msg.chat.type === CHAT_TYPES.SUPERGROUP) {
        const chatId = msg.chat.id;

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
        await this.container.get('sendJokeUseCase').execute(chatId);
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
      console.log(`⏸️ Авто-шутки остановлены для чата ${chatId}`);
    }
  }

  stop() {
    // Stop all intervals
    this.intervals.forEach((intervalId, chatId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();

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
