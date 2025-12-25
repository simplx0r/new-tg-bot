import { MessageStats } from '../../domain/valueObjects/MessageStats.js';

export class StatsRepository {
  constructor(db) {
    this.db = db;
  }

  async increment(userId, chatId) {
    const stmt = this.db.statements.get('INCREMENT');
    stmt.run(userId, chatId);

    const selectStmt = this.db.statements.get('SELECT_USER_STATS');
    const row = selectStmt.get(chatId, userId);

    return new MessageStats({
      userId: row.user_id,
      chatId: row.chat_id,
      messageCount: row.message_count,
      lastMessageAt: new Date(row.last_message_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async getUserStats(userId, chatId) {
    const stmt = this.db.statements.get('SELECT_USER_STATS');
    const row = stmt.get(chatId, userId);

    if (!row) return null;

    return new MessageStats({
      userId: row.user_id,
      chatId: row.chat_id,
      messageCount: row.message_count,
      lastMessageAt: new Date(row.last_message_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async getTopUsers(chatId, limit = 10) {
    const stmt = this.db.statements.get('SELECT_TOP_USERS');
    const rows = stmt.all(chatId, limit);

    return rows.map(row => ({
      userId: row.user_id,
      chatId: row.chat_id,
      messageCount: row.message_count,
      lastMessageAt: new Date(row.last_message_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getAllChatStats(chatId) {
    const stmt = this.db.statements.get('SELECT_ALL_CHAT_STATS');
    const rows = stmt.all(chatId);

    return rows.map(row => ({
      userId: row.user_id,
      chatId: row.chat_id,
      messageCount: row.message_count,
      lastMessageAt: new Date(row.last_message_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async getChatSummary(chatId) {
    const stmt = this.db.statements.get('SELECT_CHAT_SUMMARY');
    const row = stmt.get(chatId);

    return row ? {
      totalUsers: row.total_users,
      totalMessages: row.total_messages,
      maxMessages: row.max_messages,
    } : null;
  }
}
