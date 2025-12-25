export class Rank {
  constructor({ id, name, category, minMessages, description, emoji }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.minMessages = minMessages;
    this.description = description;
    this.emoji = emoji;
  }

  static create({ name, category, minMessages, description, emoji }) {
    return new Rank({
      name,
      category,
      minMessages,
      description,
      emoji,
    });
  }

  isEligible(messageCount) {
    return messageCount >= this.minMessages;
  }
}
