import { Rank } from '../../domain/entities/Rank.js';

export class UserRankRepository {
  constructor(db) {
    this.db = db;
  }

  async getByUser(userId) {
    const stmt = this.db.statements.get('SELECT_BY_USER');
    const row = stmt.get(userId);

    if (!row) return null;

    return new Rank({
      id: row.id,
      name: row.name,
      category: row.category,
      minMessages: row.min_messages,
      description: row.description,
      emoji: row.emoji,
    });
  }

  async assign(userId, rankId) {
    const stmt = this.db.statements.get('INSERT_OR_REPLACE');
    stmt.run(userId, rankId);
  }

  async deleteByUser(userId) {
    const stmt = this.db.statements.get('DELETE_BY_USER');
    stmt.run(userId);
  }
}
