export class ChatSettings {
  constructor({ chatId, jokesEnabled, jokesInterval, createdAt, updatedAt }) {
    this.chatId = chatId;
    this.jokesEnabled = jokesEnabled !== undefined ? jokesEnabled : true;
    this.jokesInterval = jokesInterval || 30;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create(chatId) {
    return new ChatSettings({
      chatId,
      jokesEnabled: true,
      jokesInterval: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  updateJokesEnabled(enabled) {
    this.jokesEnabled = enabled;
    this.updatedAt = new Date();
  }

  updateJokesInterval(interval) {
    this.jokesInterval = interval;
    this.updatedAt = new Date();
  }
}
