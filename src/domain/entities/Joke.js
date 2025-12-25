export class Joke {
  constructor({ id, content, category, createdAt, usedCount }) {
    this.id = id;
    this.content = content;
    this.category = category;
    this.createdAt = createdAt;
    this.usedCount = usedCount || 0;
  }

  incrementUsage() {
    this.usedCount += 1;
  }

  static create(content, category = 'general') {
    return new Joke({
      content,
      category,
      createdAt: new Date(),
      usedCount: 0,
    });
  }
}
