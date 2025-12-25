import { Joke } from '../../domain/entities/Joke.js';

export class JokeRepository {
  constructor(db) {
    this.db = db;
  }

  async getRandom() {
    const stmt = this.db.statements.get('SELECT_RANDOM');
    const row = stmt.get();

    if (!row) return null;

    return new Joke({
      id: row.id,
      content: row.content,
      category: row.category,
      createdAt: new Date(row.created_at),
      usedCount: row.used_count,
    });
  }

  async getById(id) {
    const stmt = this.db.statements.get('SELECT_BY_ID');
    const row = stmt.get(id);

    if (!row) return null;

    return new Joke({
      id: row.id,
      content: row.content,
      category: row.category,
      createdAt: new Date(row.created_at),
      usedCount: row.used_count,
    });
  }

  async getAll() {
    const stmt = this.db.statements.get('SELECT_ALL');
    const rows = stmt.all();

    return rows.map(row => new Joke({
      id: row.id,
      content: row.content,
      category: row.category,
      createdAt: new Date(row.created_at),
      usedCount: row.used_count,
    }));
  }

  async create(joke) {
    const stmt = this.db.statements.get('INSERT');
    const result = stmt.run(joke.content, joke.category);

    joke.id = result.lastInsertRowid;
    return joke;
  }

  async update(joke) {
    const stmt = this.db.statements.get('UPDATE_USAGE');
    stmt.run(joke.id);
    return joke;
  }

  async getStats() {
    const stmt = this.db.statements.get('SELECT_STATS');
    const rows = stmt.all();

    const categoryStats = {};
    rows.forEach(row => {
      if (!categoryStats[row.category]) {
        categoryStats[row.category] = { count: 0, usage: 0 };
      }
      categoryStats[row.category].count += row.count;
      categoryStats[row.category].usage += row.usage;
    });

    return categoryStats;
  }
}
