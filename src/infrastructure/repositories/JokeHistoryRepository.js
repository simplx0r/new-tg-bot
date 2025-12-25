export class JokeHistoryRepository {
  constructor(db) {
    this.db = db;
  }

  async add(jokeId, chatId) {
    const stmt = this.db.statements.get('INSERT');
    stmt.run(jokeId, chatId);
  }

  async getByChat(chatId, limit = 10) {
    const stmt = this.db.statements.get('SELECT_BY_CHAT');
    const rows = stmt.all(chatId, limit);
    return rows;
  }
}
