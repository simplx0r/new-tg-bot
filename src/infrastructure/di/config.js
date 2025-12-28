import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CalculateRankUseCase } from '../../application/useCases/CalculateRankUseCase.js';
import { RecordMessageUseCase } from '../../application/useCases/RecordMessageUseCase.js';
import { SendJokeUseCase } from '../../application/useCases/SendJokeUseCase.js';
import { ConfigValidator } from '../../config/ConfigValidator.js';
import { JokeBotManager } from '../../core/JokeBotManager.js';
import * as queries from '../../database/queries.js';
import { EventDispatcher } from '../../domain/events/EventDispatcher.js';
import { MessageHandler } from '../../presentation/handlers/MessageHandler.js';
import ReactionService from '../../services/reactionService.js';
import { CacheService } from '../cache/CacheService.js';
import { ErrorHandler } from '../errorHandling/ErrorHandler.js';
import { MetricsCollector } from '../monitoring/MetricsCollector.js';
import { ChatSettingsRepository } from '../repositories/ChatSettingsRepository.js';
import { JokeHistoryRepository } from '../repositories/JokeHistoryRepository.js';
import { JokeRepository } from '../repositories/JokeRepository.js';
import { RankRepository } from '../repositories/RankRepository.js';
import { ReactionRepository } from '../repositories/ReactionRepository.js';
import { StatsRepository } from '../repositories/StatsRepository.js';
import { UserRankRepository } from '../repositories/UserRankRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { Scheduler } from '../scheduling/Scheduler.js';
import { TelegramAdapter } from '../telegram/TelegramAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureContainer(container, config) {
  // Валидация конфигурации
  const validation = ConfigValidator.validate(config);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn(`Configuration warnings: ${validation.warnings.join(', ')}`);
  }

  // Config (singleton)
  container.registerInstance('config', config);

  // Database connection (singleton)
  container.registerSingleton('db', () => {
    const dbPath = config.database.path;
    const dir = path.dirname(dbPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Initialize tables
    db.exec(queries.USER_QUERIES.CREATE_TABLE);
    db.exec(queries.MESSAGE_STATS_QUERIES.CREATE_TABLE);
    db.exec(queries.JOKE_QUERIES.CREATE_TABLE);
    db.exec(queries.JOKE_HISTORY_QUERIES.CREATE_TABLE);
    db.exec(queries.CHAT_SETTINGS_QUERIES.CREATE_TABLE);
    db.exec(queries.ADMIN_QUERIES.CREATE_TABLE);
    db.exec(queries.RANK_QUERIES.CREATE_TABLE);
    db.exec(queries.USER_RANK_QUERIES.CREATE_TABLE);
    db.exec(queries.REACTION_QUERIES.CREATE_TABLE);
    db.exec(queries.NOTIFICATION_QUERIES.CREATE_TABLE);

    // Prepare statements
    const statements = new Map();
    Object.values(queries).forEach((querySet) => {
      Object.entries(querySet).forEach(([name, sql]) => {
        if (!sql.includes('CREATE TABLE')) {
          statements.set(name, db.prepare(sql));
        }
      });
    });
    db.statements = statements;

    return db;
  }, { disposeMethod: 'close' });

  // Event Dispatcher (singleton)
  container.registerInstance('eventDispatcher', new EventDispatcher());

  // Telegram Adapter (singleton)
  container.registerSingleton('telegramAdapter', () => {
    const adapter = new TelegramAdapter(config.telegram.token, { polling: true });

    // Добавляем обработчик ошибок для Telegram API
    const errorHandler = container.get('errorHandler');
    adapter.addErrorHandler('sendMessage', async (error, context) => {
      await errorHandler.handle(error, context);
    });

    return adapter;
  });

  // Error Handler (singleton)
  container.registerSingleton('errorHandler', () => {
    const eventDispatcher = container.get('eventDispatcher');
    return new ErrorHandler({
      eventDispatcher,
      logToConsole: true,
      dispatchEvents: true,
    });
  });

  // Scheduler (singleton)
  container.registerSingleton('scheduler', () => new Scheduler({ autoStart: true }));

  // Cache Service (singleton)
  container.registerSingleton('cacheService', () => new CacheService({
    maxSize: 1000,
    defaultTTL: 5 * 60 * 1000, // 5 минут
    enabled: true,
  }));

  // Metrics Collector (singleton)
  container.registerSingleton('metricsCollector', () => new MetricsCollector({
    enabled: true,
    maxHistorySize: 1000,
  }));

  // Repositories (transient)
  container.registerTransient('userRepository', (container) => new UserRepository(container.get('db')));

  container.registerTransient('statsRepository', (container) => new StatsRepository(container.get('db')));

  container.registerTransient('jokeRepository', (container) => new JokeRepository(container.get('db')));

  container.registerTransient('jokeHistoryRepository', (container) => new JokeHistoryRepository(container.get('db')));

  container.registerTransient('rankRepository', (container) => new RankRepository(container.get('db')));

  container.registerTransient('userRankRepository', (container) => new UserRankRepository(container.get('db')));

  container.registerTransient('chatSettingsRepository', (container) => new ChatSettingsRepository(container.get('db')));

  container.registerTransient('reactionRepository', (container) => new ReactionRepository(container.get('db')));

  // Services (transient)
  container.registerTransient('reactionService', (container) => new ReactionService(container.get('reactionRepository')));

  // Use Cases (transient)
  container.registerTransient('recordMessageUseCase', (container) => new RecordMessageUseCase(
    container.get('userRepository'),
    container.get('statsRepository'),
    container.get('eventDispatcher'),
  ));

  container.registerTransient('sendJokeUseCase', (container) => new SendJokeUseCase(
    container.get('jokeRepository'),
    container.get('jokeHistoryRepository'),
    container.get('eventDispatcher'),
  ));

  container.registerTransient('calculateRankUseCase', (container) => new CalculateRankUseCase(
    container.get('rankRepository'),
    container.get('userRankRepository'),
    container.get('eventDispatcher'),
  ));

  // Handlers (transient)
  container.registerTransient('messageHandler', (container) => new MessageHandler(
    container.get('recordMessageUseCase'),
    container.get('calculateRankUseCase'),
    container.get('reactionService'),
    container.get('userRepository'),
    container.get('config').telegram.defaultTopicId,
  ));

  // Bot Manager (singleton)
  container.registerSingleton('jokeBotManager', (container) => new JokeBotManager(container));
}
