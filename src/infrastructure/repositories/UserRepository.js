import { User } from '../../domain/entities/User.js';

export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async getOrCreate(telegramUser) {
    const stmt = this.db.statements.get('INSERT_OR_IGNORE');
    stmt.run(
      telegramUser.id,
      telegramUser.username || null,
      telegramUser.first_name || null,
      telegramUser.last_name || null,
    );

    const selectStmt = this.db.statements.get('SELECT_BY_TELEGRAM_ID');
    const row = selectStmt.get(telegramUser.id);

    return new User({
      id: row.id,
      telegramId: row.telegram_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async update(telegramId, userData) {
    const stmt = this.db.statements.get('UPDATE');
    stmt.run(
      userData.username || null,
      userData.first_name || null,
      userData.last_name || null,
      telegramId
    );
  }

  async getById(id) {
    const stmt = this.db.statements.get('SELECT_BY_ID');
    const row = stmt.get(id);

    if (!row) return null;

    return new User({
      id: row.id,
      telegramId: row.telegram_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async getByTelegramId(telegramId) {
    const stmt = this.db.statements.get('SELECT_BY_TELEGRAM_ID');
    const row = stmt.get(telegramId);

    if (!row) return null;

    return new User({
      id: row.id,
      telegramId: row.telegram_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async isAdmin(telegramId) {
    // Check if user is in admins table
    const adminStmt = this.db.statements.get('SELECT_BY_TELEGRAM_ID');
    const adminRow = adminStmt.get(telegramId);

    return !!adminRow;
  }
}
