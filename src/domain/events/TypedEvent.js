/**
 * Базовый класс для типизированных событий
 * Обеспечивает типобезопасность и автодополнение в IDE
 */
export class TypedEvent {
  /**
   * @param {string} name - Имя события
   * @param {Object} payload - Данные события
   * @param {Date} timestamp - Время создания события
   */
  constructor(name, payload = {}, timestamp = new Date()) {
    this.name = name;
    this.payload = payload;
    this.timestamp = timestamp;
    this.id = this._generateId();
  }

  /**
   * Сериализовать событие в JSON
   * @returns {Object} Объект события
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      payload: this.payload,
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Создать событие из JSON
   * @param {Object} json - JSON объект
   * @returns {TypedEvent} Экземпляр события
   */
  static fromJSON(json) {
    return new TypedEvent(
      json.name,
      json.payload,
      new Date(json.timestamp),
    );
  }

  /**
   * Сгенерировать уникальный ID события
   * @private
   * @returns {string} ID события
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Событие записи сообщения
 */
export class MessageRecordedEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {Object} payload.user - Пользователь
   * @param {Object} payload.stats - Статистика
   * @param {number} payload.chatId - ID чата
   */
  constructor(payload) {
    super('message.recorded', payload);
  }
}

/**
 * Событие отправки шутки
 */
export class JokeSentEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {Object} payload.joke - Шутка
   * @param {number} payload.chatId - ID чата
   * @param {number|null} payload.threadId - ID темы (опционально)
   */
  constructor(payload) {
    super('joke.sent', payload);
  }
}

/**
 * Событие получения звания
 */
export class RankEarnedEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {number} payload.userId - ID пользователя
   * @param {Object} payload.rank - Звание
   * @param {number} payload.chatId - ID чата
   * @param {number|null} payload.threadId - ID темы (опционально)
   */
  constructor(payload) {
    super('rank.earned', payload);
  }
}

/**
 * Событие ошибки
 */
export class ErrorEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {Error} payload.error - Ошибка
   * @param {string} payload.context - Контекст ошибки
   * @param {Object} payload.metadata - Метаданные
   */
  constructor(payload) {
    super('error.occurred', payload);
  }
}

/**
 * Событие запуска авто-шуток
 */
export class AutoJokesStartedEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {number} payload.chatId - ID чата
   * @param {number} payload.interval - Интервал в минутах
   */
  constructor(payload) {
    super('autojokes.started', payload);
  }
}

/**
 * Событие остановки авто-шуток
 */
export class AutoJokesStoppedEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {number} payload.chatId - ID чата
   */
  constructor(payload) {
    super('autojokes.stopped', payload);
  }
}

/**
 * Событие нового участника чата
 */
export class NewChatMemberEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {Object} payload.member - Участник
   * @param {number} payload.chatId - ID чата
   * @param {number|null} payload.threadId - ID темы (опционально)
   */
  constructor(payload) {
    super('chat.member.new', payload);
  }
}

/**
 * Событие выхода участника из чата
 */
export class LeftChatMemberEvent extends TypedEvent {
  /**
   * @param {Object} payload - Payload события
   * @param {Object} payload.member - Участник
   * @param {number} payload.chatId - ID чата
   * @param {number|null} payload.threadId - ID темы (опционально)
   */
  constructor(payload) {
    super('chat.member.left', payload);
  }
}

/**
 * Реестр типов событий для автодополнения и валидации
 */
export const EventTypes = {
  MESSAGE_RECORDED: 'message.recorded',
  JOKE_SENT: 'joke.sent',
  RANK_EARNED: 'rank.earned',
  ERROR_OCCURRED: 'error.occurred',
  AUTOJOKES_STARTED: 'autojokes.started',
  AUTOJOKES_STOPPED: 'autojokes.stopped',
  CHAT_MEMBER_NEW: 'chat.member.new',
  CHAT_MEMBER_LEFT: 'chat.member.left',
};

/**
 * Карта типов событий для создания экземпляров
 */
export const EventClassMap = {
  [EventTypes.MESSAGE_RECORDED]: MessageRecordedEvent,
  [EventTypes.JOKE_SENT]: JokeSentEvent,
  [EventTypes.RANK_EARNED]: RankEarnedEvent,
  [EventTypes.ERROR_OCCURRED]: ErrorEvent,
  [EventTypes.AUTOJOKES_STARTED]: AutoJokesStartedEvent,
  [EventTypes.AUTOJOKES_STOPPED]: AutoJokesStoppedEvent,
  [EventTypes.CHAT_MEMBER_NEW]: NewChatMemberEvent,
  [EventTypes.CHAT_MEMBER_LEFT]: LeftChatMemberEvent,
};

/**
 * Создать событие по имени и payload
 * @param {string} eventName - Имя события
 * @param {Object} payload - Payload события
 * @returns {TypedEvent} Экземпляр события
 */
export function createEvent(eventName, payload = {}) {
  const EventClass = EventClassMap[eventName];
  if (EventClass) {
    return new EventClass(payload);
  }
  return new TypedEvent(eventName, payload);
}
