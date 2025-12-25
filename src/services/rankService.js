import { EMOJI, RANK_CATEGORIES } from '../constants/index.js';
import { formatRanksList, formatUserName } from '../utils/formatters.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

class RankService {
  constructor(db) {
    this.db = db;
  }

  addRank(rankData) {
    return this.db.addRank(rankData);
  }

  getAllRanks() {
    return this.db.getAllRanks();
  }

  getRanksByCategory(category) {
    return this.db.getRanksByCategory(category);
  }

  getRankById(id) {
    return this.db.getRankById(id);
  }

  getUserRank(userId) {
    return this.db.getUserRank(userId);
  }

  calculateAndAssignRank(userId, chatId) {
    return this.db.calculateAndAssignRank(userId, chatId);
  }

  formatUserRank(user) {
    if (!user.rank_name) {
      return `${EMOJI.USER} ${formatUserName(user)}\n${EMOJI.AGENT} Звание: Не присвоено`;
    }

    const emoji = user.rank_emoji || EMOJI.AGENT;
    return `${EMOJI.USER} ${formatUserName(user)}\n${emoji} Звание: ${user.rank_name}`;
  }

  formatRanksList(ranks) {
    return formatRanksList(ranks);
  }

  formatRanksByCategory() {
    const allRanks = this.getAllRanks();
    const agencyRanks = allRanks.filter((r) => r.category === RANK_CATEGORIES.AGENCY);
    const interviewRanks = allRanks.filter((r) => r.category === RANK_CATEGORIES.INTERVIEW);

    let message = `${EMOJI.AGENT} Система званий:\n\n`;

    message += `${EMOJI.SHIELD} Агентские звания:\n`;
    agencyRanks.forEach((rank) => {
      message += `  ${rank.emoji || EMOJI.AGENT} ${rank.name} (${rank.min_messages}+ сообщений)\n`;
    });

    message += `\n${EMOJI.BRIEFCASE} Звания IT-специалистов:\n`;
    interviewRanks.forEach((rank) => {
      message += `  ${rank.emoji || EMOJI.BRIEFCASE} ${rank.name} (${rank.min_messages}+ сообщений)\n`;
    });

    return message;
  }

  checkAndNotifyRankUp(userId, chatId, bot) {
    const currentRank = this.getUserRank(userId);
    const newRank = this.calculateAndAssignRank(userId, chatId);

    if (newRank && (!currentRank || currentRank.id !== newRank.id)) {
      const user = this.db.getOrCreateUser({ id: userId });
      const userName = formatUserName(user);
      const emoji = newRank.emoji || EMOJI.AGENT;

      const message = `${EMOJI.SPARKLES} Поздравляем ${userName}! ${emoji}\n\n`
        + `Вы получили новое звание: ${newRank.name}!\n`
        + `${newRank.description || ''}`;

      return safeSendMessage(bot, chatId, message);
    }

    return null;
  }
}

export default RankService;
