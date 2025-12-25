import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CalculateRankUseCase } from '../../application/useCases/CalculateRankUseCase.js';
import { RecordMessageUseCase } from '../../application/useCases/RecordMessageUseCase.js';
import { SendJokeUseCase } from '../../application/useCases/SendJokeUseCase.js';
import * as queries from '../../database/queries.js';
import { EventDispatcher } from '../../domain/events/EventDispatcher.js';
import { ChatSettingsRepository } from '../repositories/ChatSettingsRepository.js';
import { JokeRepository } from '../repositories/JokeRepository.js';
import { JokeHistoryRepository } from '../repositories/JokeHistoryRepository.js';
import { RankRepository } from '../repositories/RankRepository.js';
import { ReactionRepository } from '../repositories/ReactionRepository.js';
import { StatsRepository } from '../repositories/StatsRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { UserRankRepository } from '../repositories/UserRankRepository.js';
import ReactionService from '../../services/reactionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureContainer(container, config) {
  // Database connection
  container.register('db', () => {
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
    Object.values(queries).forEach(querySet => {
      Object.entries(querySet).forEach(([name, sql]) => {
        if (!sql.includes('CREATE TABLE')) {
          statements.set(name, db.prepare(sql));
        }
      });
    });
    db.statements = statements;

    return db;
  });

  // Event Dispatcher (singleton)
  container.registerInstance('eventDispatcher', new EventDispatcher());

  // Repositories
  container.register('userRepository', (container) => {
    return new UserRepository(container.get('db'));
  });

  container.register('statsRepository', (container) => {
    return new StatsRepository(container.get('db'));
  });

  container.register('jokeRepository', (container) => {
    return new JokeRepository(container.get('db'));
  });

  container.register('jokeHistoryRepository', (container) => {
    return new JokeHistoryRepository(container.get('db'));
  });

  container.register('rankRepository', (container) => {
    return new RankRepository(container.get('db'));
  });

  container.register('userRankRepository', (container) => {
    return new UserRankRepository(container.get('db'));
  });

  container.register('chatSettingsRepository', (container) => {
    return new ChatSettingsRepository(container.get('db'));
  });

  container.register('reactionRepository', (container) => {
    return new ReactionRepository(container.get('db'));
  });

  container.register('reactionService', (container) => {
    return new ReactionService(container.get('reactionRepository'));
  });

  // Use Cases
  container.register('recordMessageUseCase', (container) => {
    return new RecordMessageUseCase(
      container.get('userRepository'),
      container.get('statsRepository'),
      container.get('eventDispatcher')
    );
  });

  container.register('sendJokeUseCase', (container) => {
    return new SendJokeUseCase(
      container.get('jokeRepository'),
      container.get('jokeHistoryRepository'),
      container.get('eventDispatcher')
    );
  });

  container.register('calculateRankUseCase', (container) => {
    return new CalculateRankUseCase(
      container.get('rankRepository'),
      container.get('userRankRepository'),
      container.get('eventDispatcher')
    );
  });
}
