import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as queries from './queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.statements = new Map();
  }

  connect() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeTables();
    this.prepareStatements();
    this.seedRanks();
  }

  initializeTables() {
    this.db.exec(queries.USER_QUERIES.CREATE_TABLE);
    this.db.exec(queries.MESSAGE_STATS_QUERIES.CREATE_TABLE);
    this.db.exec(queries.JOKE_QUERIES.CREATE_TABLE);
    this.db.exec(queries.JOKE_HISTORY_QUERIES.CREATE_TABLE);
    this.db.exec(queries.CHAT_SETTINGS_QUERIES.CREATE_TABLE);
    this.db.exec(queries.ADMIN_QUERIES.CREATE_TABLE);
    this.db.exec(queries.RANK_QUERIES.CREATE_TABLE);
    this.db.exec(queries.USER_RANK_QUERIES.CREATE_TABLE);
    this.db.exec(queries.REACTION_QUERIES.CREATE_TABLE);
    this.db.exec(queries.NOTIFICATION_QUERIES.CREATE_TABLE);
  }

  prepareStatements() {
    Object.values(queries).forEach((querySet) => {
      Object.entries(querySet).forEach(([name, sql]) => {
        if (!sql.includes('CREATE TABLE')) {
          this.statements.set(name, this.db.prepare(sql));
        }
      });
    });
  }

  seedRanks() {
    const existingRanks = this.getAllRanks();
    if (existingRanks.length > 0) {
      return;
    }

    const agencyRanks = [
      { name: 'Новичок', category: 'agency', minMessages: 0, description: 'Только начинаешь свой путь', emoji: '🐣' },
      { name: 'Агент-стажёр', category: 'agency', minMessages: 10, description: 'Показал потенциал', emoji: '🎓' },
      { name: 'Младший агент', category: 'agency', minMessages: 50, description: 'Доказал свою полезность', emoji: '🔫' },
      { name: 'Агент', category: 'agency', minMessages: 100, description: 'Надёжный член команды', emoji: '🕵️' },
      { name: 'Старший агент', category: 'agency', minMessages: 250, description: 'Опытный профессионал', emoji: '🎖️' },
      { name: 'Специальный агент', category: 'agency', minMessages: 500, description: 'Элита агентства', emoji: '⭐' },
      { name: 'Легенда агентства', category: 'agency', minMessages: 1000, description: 'Живая легенда', emoji: '🏆' },
    ];

    const interviewRanks = [
      { name: 'Junior', category: 'interview', minMessages: 0, description: 'Начинающий разработчик', emoji: '🌱' },
      { name: 'Middle', category: 'interview', minMessages: 50, description: 'Опытный разработчик', emoji: '💻' },
      { name: 'Senior', category: 'interview', minMessages: 150, description: 'Ведущий разработчик', emoji: '🚀' },
      { name: 'Tech Lead', category: 'interview', minMessages: 300, description: 'Технический лидер', emoji: '👑' },
      { name: 'Architect', category: 'interview', minMessages: 500, description: 'Архитектор решений', emoji: '🏗️' },
      { name: 'CTO Material', category: 'interview', minMessages: 1000, description: 'Потенциальный CTO', emoji: '💎' },
    ];

    [...agencyRanks, ...interviewRanks].forEach((rank) => {
      this.addRank(rank);
    });
  }

  // User methods
  getOrCreateUser(telegramUser) {
    const stmt = this.statements.get('INSERT_OR_IGNORE');
    stmt.run(
      telegramUser.id,
      telegramUser.username || null,
      telegramUser.first_name || null,
      telegramUser.last_name || null,
    );

    const selectStmt = this.statements.get('SELECT_BY_TELEGRAM_ID');
    return selectStmt.get(telegramUser.id);
  }

  updateUser(telegramId, userData) {
    const stmt = this.statements.get('UPDATE');
    return stmt.run(
      userData.username || null,
      userData.first_name || null,
      userData.last_name || null,
      telegramId,
    );
  }

  // Message stats methods
  incrementMessageCount(userId, chatId) {
    const stmt = this.statements.get('INCREMENT');
    return stmt.run(userId, chatId);
  }

  getUserStats(userId, chatId) {
    const stmt = this.statements.get('SELECT_USER_STATS');
    return stmt.get(chatId, userId);
  }

  getTopUsers(chatId, limit = 10) {
    const stmt = this.statements.get('SELECT_TOP_USERS');
    return stmt.all(chatId, limit);
  }

  getAllChatStats(chatId) {
    const stmt = this.statements.get('SELECT_ALL_CHAT_STATS');
    return stmt.all(chatId);
  }

  getChatSummary(chatId) {
    const stmt = this.statements.get('SELECT_CHAT_SUMMARY');
    return stmt.get(chatId);
  }

  // Joke methods
  addJoke(content, category = 'general') {
    const stmt = this.statements.get('INSERT');
    return stmt.run(content, category);
  }

  getRandomJoke() {
    const stmt = this.statements.get('SELECT_RANDOM');
    return stmt.get();
  }

  getJokeById(id) {
    const stmt = this.statements.get('SELECT_BY_ID');
    return stmt.get(id);
  }

  getAllJokes() {
    const stmt = this.statements.get('SELECT_ALL');
    return stmt.all();
  }

  incrementJokeUsage(jokeId) {
    const stmt = this.statements.get('UPDATE_USAGE');
    return stmt.run(jokeId);
  }

  recordJokeHistory(jokeId, chatId) {
    const stmt = this.statements.get('INSERT');
    return stmt.run(jokeId, chatId);
  }

  getJokeStats() {
    const stmt = this.statements.get('SELECT_STATS');
    return stmt.all();
  }

  // Chat settings methods
  getChatSettings(chatId) {
    const stmt = this.statements.get('SELECT_BY_CHAT_ID');
    let settings = stmt.get(chatId);

    if (!settings) {
      const insertStmt = this.statements.get('CHAT_SETTINGS_INSERT');
      insertStmt.run(chatId);
      settings = stmt.get(chatId);
    }

    return settings;
  }

  updateChatSettings(chatId, settings) {
    const stmt = this.statements.get('CHAT_SETTINGS_UPDATE');
    let jokesEnabledValue = null;
    if (settings.jokesEnabled !== null) {
      jokesEnabledValue = settings.jokesEnabled ? 1 : 0;
    }
    return stmt.run(jokesEnabledValue, settings.jokesInterval, chatId);
  }

  // Admin methods
  addAdmin(telegramId, addedBy) {
    const stmt = this.statements.get('INSERT_OR_IGNORE');
    return stmt.run(telegramId, addedBy);
  }

  removeAdmin(telegramId) {
    const stmt = this.statements.get('DELETE');
    return stmt.run(telegramId);
  }

  isAdmin(telegramId) {
    const stmt = this.statements.get('SELECT_BY_TELEGRAM_ID');
    return !!stmt.get(telegramId);
  }

  getAllAdmins() {
    const stmt = this.statements.get('SELECT_ALL');
    return stmt.all();
  }

  // Rank methods
  addRank(rank) {
    const stmt = this.statements.get('INSERT');
    return stmt.run(rank.name, rank.category, rank.minMessages, rank.description, rank.emoji);
  }

  getAllRanks() {
    const stmt = this.statements.get('SELECT_ALL');
    return stmt.all();
  }

  getRanksByCategory(category) {
    const stmt = this.statements.get('SELECT_BY_CATEGORY');
    return stmt.all(category);
  }

  getRankById(id) {
    const stmt = this.statements.get('SELECT_BY_ID');
    return stmt.get(id);
  }

  updateUserRank(userId, rankId) {
    const stmt = this.statements.get('INSERT_OR_REPLACE');
    return stmt.run(userId, rankId);
  }

  getUserRank(userId) {
    const stmt = this.statements.get('SELECT_BY_USER');
    return stmt.get(userId);
  }

  removeUserRank(userId) {
    const stmt = this.statements.get('DELETE_BY_USER');
    return stmt.run(userId);
  }

  calculateAndAssignRank(userId, chatId) {
    const stats = this.getUserStats(userId, chatId);
    if (!stats) {
      return null;
    }

    const messageCount = stats.message_count || 0;
    const ranks = this.getAllRanks();

    let bestRank = null;
    for (const rank of ranks) {
      if (messageCount >= rank.minMessages) {
        if (!bestRank || rank.minMessages > bestRank.minMessages) {
          bestRank = rank;
        }
      }
    }

    if (bestRank) {
      this.updateUserRank(userId, bestRank.id);
      return bestRank;
    }

    return null;
  }

  // Reaction methods
  addReaction(triggerText, reactionType, reactionContent, category = 'general') {
    const stmt = this.statements.get('INSERT');
    return stmt.run(triggerText, reactionType, reactionContent, category);
  }

  getAllReactions() {
    const stmt = this.statements.get('SELECT_ALL');
    return stmt.all();
  }

  getReactionsByCategory(category) {
    const stmt = this.statements.get('SELECT_BY_CATEGORY');
    return stmt.all(category);
  }

  getRandomReaction() {
    const stmt = this.statements.get('SELECT_RANDOM');
    return stmt.get();
  }

  // Notification methods
  recordNotification(chatId, message, sentBy) {
    const stmt = this.statements.get('INSERT');
    return stmt.run(chatId, message, sentBy);
  }

  getNotificationHistory(chatId, limit = 10) {
    const stmt = this.statements.get('SELECT_BY_CHAT');
    return stmt.all(chatId, limit);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default DatabaseManager;
