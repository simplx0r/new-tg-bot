export class MessageStats {
  constructor({ userId, chatId, messageCount, lastMessageAt, createdAt, updatedAt }) {
    this.userId = userId;
    this.chatId = chatId;
    this.messageCount = messageCount || 0;
    this.lastMessageAt = lastMessageAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  increment() {
    this.messageCount += 1;
    this.lastMessageAt = new Date();
    this.updatedAt = new Date();
  }

  static create(userId, chatId) {
    return new MessageStats({
      userId,
      chatId,
      messageCount: 1,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
