export class ReactionRepository {
  constructor(db) {
    this.db = db;
  }

  async addReaction(triggerText, reactionType, reactionContent, category = 'general') {
    const stmt = this.db.statements.get('INSERT');
    stmt.run(triggerText, reactionType, reactionContent, category);
  }

  async getAllReactions() {
    const stmt = this.db.statements.get('SELECT_ALL');
    return stmt.all();
  }

  async getReactionsByCategory(category) {
    const stmt = this.db.statements.get('SELECT_BY_CATEGORY');
    return stmt.all(category);
  }

  async getRandomReaction() {
    const stmt = this.db.statements.get('SELECT_RANDOM');
    return stmt.get();
  }
}
