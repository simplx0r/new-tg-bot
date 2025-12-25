import {
  formatAllStats,
  formatChatSummary as formatChatSummaryUtil,
  formatTopUsers,
  formatUserName,
  formatUserStats,
} from '../utils/formatters.js';

class StatsService {
  constructor(db) {
    this.db = db;
  }

  recordMessage(user) {
    const dbUser = this.db.getOrCreateUser(user);
    this.db.incrementMessageCount(dbUser.id, user.chat_id);
    return dbUser;
  }

  getUserStats(telegramId, chatId) {
    const user = this.db.getOrCreateUser({ id: telegramId });
    return this.db.getUserStats(user.id, chatId);
  }

  getTopUsers(chatId, limit = 10) {
    return this.db.getTopUsers(chatId, limit);
  }

  getAllChatStats(chatId) {
    return this.db.getAllChatStats(chatId);
  }

  getChatSummary(chatId) {
    const summaryData = this.db.getChatSummary(chatId);

    if (!summaryData) {
      return {
        totalMessages: 0,
        totalUsers: 0,
        mostActiveName: 'Нет данных',
        mostActiveCount: 0,
      };
    }

    const mostActive = this.db.getTopUsers(chatId, 1)[0];
    const mostActiveName = mostActive
      ? formatUserName(mostActive)
      : 'Нет данных';

    return {
      totalMessages: summaryData.total_messages || 0,
      totalUsers: summaryData.total_users || 0,
      mostActiveName,
      mostActiveCount: mostActive?.message_count || 0,
    };
  }

  formatUserStats(user) {
    return formatUserStats(user);
  }

  formatTopUsers(users) {
    return formatTopUsers(users);
  }

  formatAllStats(users) {
    return formatAllStats(users);
  }

  formatChatSummary(chatId) {
    const summary = this.getChatSummary(chatId);
    return formatChatSummaryUtil(summary);
  }
}

export default StatsService;
