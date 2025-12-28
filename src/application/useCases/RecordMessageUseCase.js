import { MessageRecordedEvent } from '../../domain/events/TypedEvent.js';

/**
 * Use Case для записи сообщения пользователя
 * Создаёт или получает пользователя, инкрементирует статистику и отправляет событие
 */
export class RecordMessageUseCase {
  /**
   * @param {Object} userRepository - Репозиторий пользователей
   * @param {Object} statsRepository - Репозиторий статистики
   * @param {Object} eventDispatcher - Диспетчер событий
   */
  constructor(userRepository, statsRepository, eventDispatcher) {
    this.userRepository = userRepository;
    this.statsRepository = statsRepository;
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * Выполнить Use Case
   * @param {Object} telegramUser - Пользователь из Telegram
   * @param {number} chatId - ID чата
   * @returns {Promise<Object>} Результат выполнения
   */
  async execute(telegramUser, chatId) {
    // Получаем или создаём пользователя
    const user = await this.userRepository.getOrCreate(telegramUser);

    // Инкрементируем статистику
    const stats = await this.statsRepository.increment(user.id, chatId);

    // Отправляем событие
    const event = new MessageRecordedEvent({
      user,
      stats,
      chatId,
    });

    await this.eventDispatcher.dispatch(event);

    return { user, stats };
  }
}
