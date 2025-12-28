import { RankEarnedEvent } from '../../domain/events/TypedEvent.js';

/**
 * Use Case для расчёта и присвоения звания
 * Проверяет, соответствует ли пользователь новым требованиям для звания
 */
export class CalculateRankUseCase {
  /**
   * @param {Object} rankRepository - Репозиторий званий
   * @param {Object} userRankRepository - Репозиторий званий пользователей
   * @param {Object} eventDispatcher - Диспетчер событий
   */
  constructor(rankRepository, userRankRepository, eventDispatcher) {
    this.rankRepository = rankRepository;
    this.userRankRepository = userRankRepository;
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * Выполнить Use Case
   * @param {number} userId - ID пользователя
   * @param {number} chatId - ID чата
   * @param {number} messageCount - Количество сообщений
   * @param {number|null} threadId - ID темы
   * @returns {Promise<Object|null>} Полученное звание или null
   */
  async execute(userId, chatId, messageCount, threadId = null) {
    // Получаем все звания
    const allRanks = await this.rankRepository.getAll();

    // Получаем текущее звание пользователя
    const currentRank = await this.userRankRepository.getByUser(userId);

    // Находим лучшее доступное звание
    let bestRank = null;
    for (const rank of allRanks) {
      if (rank.isEligible(messageCount)) {
        if (!bestRank || rank.minMessages > bestRank.minMessages) {
          bestRank = rank;
        }
      }
    }

    // Если нашли новое лучшее звание, присваиваем его
    if (bestRank && (!currentRank || currentRank.id !== bestRank.id)) {
      await this.userRankRepository.assign(userId, bestRank.id);

      // Отправляем событие
      const event = new RankEarnedEvent({
        userId,
        rank: bestRank,
        chatId,
        threadId,
      });

      await this.eventDispatcher.dispatch(event);

      return bestRank;
    }

    return null;
  }
}
