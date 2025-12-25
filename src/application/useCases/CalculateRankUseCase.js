export class CalculateRankUseCase {
  constructor(rankRepository, userRankRepository, eventDispatcher) {
    this.rankRepository = rankRepository;
    this.userRankRepository = userRankRepository;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(userId, chatId, messageCount) {
    const allRanks = await this.rankRepository.getAll();
    const currentRank = await this.userRankRepository.getByUser(userId);

    let bestRank = null;
    for (const rank of allRanks) {
      if (rank.isEligible(messageCount)) {
        if (!bestRank || rank.minMessages > bestRank.minMessages) {
          bestRank = rank;
        }
      }
    }

    if (bestRank && (!currentRank || currentRank.id !== bestRank.id)) {
      await this.userRankRepository.assign(userId, bestRank.id);

      await this.eventDispatcher.dispatch({
        name: 'rank.earned',
        payload: { userId, rank: bestRank, chatId },
      });
    }

    return bestRank;
  }
}
