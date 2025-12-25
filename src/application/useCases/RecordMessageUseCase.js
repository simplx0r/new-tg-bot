export class RecordMessageUseCase {
  constructor(userRepository, statsRepository, eventDispatcher) {
    this.userRepository = userRepository;
    this.statsRepository = statsRepository;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(telegramUser, chatId) {
    const user = await this.userRepository.getOrCreate(telegramUser);
    const stats = await this.statsRepository.increment(user.id, chatId);

    await this.eventDispatcher.dispatch({
      name: 'message.recorded',
      payload: { user, stats, chatId },
    });

    return { user, stats };
  }
}
