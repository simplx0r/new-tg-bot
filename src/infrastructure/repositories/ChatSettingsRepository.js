import { ChatSettings } from '../../domain/valueObjects/ChatSettings.js';

export class ChatSettingsRepository {
  constructor(db) {
    this.db = db;
  }

  async getOrCreate(chatId) {
    const stmt = this.db.statements.get('SELECT_BY_CHAT_ID');
    let row = stmt.get(chatId);

    if (!row) {
      const insertStmt = this.db.statements.get('INSERT');
      insertStmt.run(chatId);
      row = stmt.get(chatId);
    }

    return new ChatSettings({
      id: row.id,
      chatId: row.chat_id,
      jokesEnabled: row.jokes_enabled === 1,
      jokesInterval: row.jokes_interval,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async update(chatId, settings) {
    const stmt = this.db.statements.get('UPDATE');
    stmt.run(
      settings.jokesEnabled !== undefined ? (settings.jokesEnabled ? 1 : 0) : null,
      settings.jokesInterval || null,
      chatId
    );
  }
}
