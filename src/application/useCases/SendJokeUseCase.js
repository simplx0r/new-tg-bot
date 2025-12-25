export class SendJokeUseCase {
  constructor(jokeRepository, jokeHistoryRepository, eventDispatcher) {
    this.jokeRepository = jokeRepository;
    this.jokeHistoryRepository = jokeHistoryRepository;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(chatId, category = null) {
    const joke = await this.jokeRepository.getRandom();

    if (!joke) {
      throw new Error('No jokes available');
    }

    await this.jokeRepository.update(joke);
    await this.jokeHistoryRepository.add(joke.id, chatId);

    await this.eventDispatcher.dispatch({
      name: 'joke.sent',
      payload: { joke, chatId },
    });

    return joke;
  }
}
