import { JokeSentEvent } from '../../domain/events/TypedEvent.js';

/**
 * Use Case для отправки шутки
 * Получает случайную шутку, обновляет счётчик и отправляет событие
 */
export class SendJokeUseCase {
  /**
   * @param {Object} jokeRepository - Репозиторий шуток
   * @param {Object} jokeHistoryRepository - Репозиторий истории шуток
   * @param {Object} eventDispatcher - Диспетчер событий
   */
  constructor(jokeRepository, jokeHistoryRepository, eventDispatcher) {
    this.jokeRepository = jokeRepository;
    this.jokeHistoryRepository = jokeHistoryRepository;
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * Выполнить Use Case
   * @param {number} chatId - ID чата
   * @param {string|null} category - Категория шутки (не используется)
   * @param {number|null} threadId - ID темы
   * @returns {Promise<Object>} Шутка
   */
  async execute(chatId, category = null, threadId = null) {
    // Получаем случайную шутку
    const joke = await this.jokeRepository.getRandom();

    if (!joke) {
      throw new Error('No jokes available');
    }

    // Обновляем счётчик использования
    await this.jokeRepository.update(joke);

    // Добавляем в историю
    await this.jokeHistoryRepository.add(joke.id, chatId);

    // Отправляем событие
    const event = new JokeSentEvent({
      joke,
      chatId,
      threadId,
    });

    await this.eventDispatcher.dispatch(event);

    return joke;
  }
}
