export class User {
  constructor({ id, telegramId, username, firstName, lastName, createdAt, updatedAt }) {
    this.id = id;
    this.telegramId = telegramId;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromTelegramUser(telegramUser) {
    return new User({
      telegramId: telegramUser.id,
      username: telegramUser.username || null,
      firstName: telegramUser.first_name || null,
      lastName: telegramUser.last_name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateFromTelegramUser(telegramUser) {
    this.username = telegramUser.username || this.username;
    this.firstName = telegramUser.first_name || this.firstName;
    this.lastName = telegramUser.last_name || this.lastName;
    this.updatedAt = new Date();
  }

  get displayName() {
    if (this.username) return `@${this.username}`;
    if (this.firstName) return this.firstName;
    return 'Пользователь';
  }
}
