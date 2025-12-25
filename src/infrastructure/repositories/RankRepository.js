import { Rank } from '../../domain/entities/Rank.js';

export class RankRepository {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const stmt = this.db.statements.get('SELECT_ALL');
    const rows = stmt.all();

    return rows.map(row => new Rank({
      id: row.id,
      name: row.name,
      category: row.category,
      minMessages: row.min_messages,
      description: row.description,
      emoji: row.emoji,
    }));
  }

  async getByCategory(category) {
    const stmt = this.db.statements.get('SELECT_BY_CATEGORY');
    const rows = stmt.all(category);

    return rows.map(row => new Rank({
      id: row.id,
      name: row.name,
      category: row.category,
      minMessages: row.min_messages,
      description: row.description,
      emoji: row.emoji,
    }));
  }

  async getById(id) {
    const stmt = this.db.statements.get('SELECT_BY_ID');
    const row = stmt.get(id);

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

  async create(rank) {
    const stmt = this.db.statements.get('INSERT');
    const result = stmt.run(
      rank.name,
      rank.category,
      rank.minMessages,
      rank.description || null,
      rank.emoji || null
    );

    rank.id = result.lastInsertRowid;
    return rank;
  }
}
