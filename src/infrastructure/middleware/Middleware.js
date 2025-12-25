import { logger } from '../logging/Logger.js';

/**
 * Класс для управления цепочкой middleware
 */
export class MiddlewarePipeline {
  constructor() {
    this.middlewares = [];
  }

  /**
   * Добавить middleware в цепочку
   * @param {Function} middleware - Функция middleware (context, next) => {}
   * @returns {MiddlewarePipeline} Возвращает this для цепочного вызова
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Выполнить цепочку middleware
   * @param {Object} context - Контекст выполнения (message, bot, etc.)
   * @param {Function} handler - Финальный обработчик
   * @returns {Promise<void>}
   */
  async execute(context, handler) {
    let index = 0;

    const runNext = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index];
        index++;
        const result = await middleware(context, runNext);

        // Если middleware вернул false, прерываем цепочку
        if (result === false) {
          return false;
        }

        return result;
      }

      // Вызываем финальный обработчик
      if (handler) {
        return await handler(context);
      }
    };

    return runNext();
  }

  /**
   * Очистить все middleware
   */
  clear() {
    this.middlewares = [];
  }
}

/**
 * Middleware для обработки ошибок
 * @param {Error} error - Объект ошибки
 * @param {Object} context - Контекст выполнения
 * @returns {boolean} false для остановки цепочки
 */
export function errorHandlerMiddleware(error, context) {
  logger.error('Error in middleware', error, { context });

  if (error.statusCode) {
    context.reply = {
      text: `❌ Ошибка: ${error.message}`,
    };
  } else {
    context.reply = {
      text: '❌ Произошла внутренняя ошибка. Попробуйте позже.',
    };
  }

  return false; // Stop middleware chain
}

/**
 * Middleware для валидации сообщения
 * Проверяет наличие необходимых полей в сообщении
 * @param {Object} context - Контекст выполнения
 * @param {Function} next - Следующая функция в цепочке
 * @returns {Promise<boolean>}
 */
export async function validationMiddleware(context, next) {
  if (!context.message || !context.message.from) {
    logger.warn('Invalid message context', { context });
    return false;
  }

  if (!context.message.chat) {
    logger.warn('Invalid chat context', { context });
    return false;
  }

  return next();
}

/**
 * Middleware для логирования сообщений
 * @param {Object} context - Контекст выполнения
 * @param {Function} next - Следующая функция в цепочке
 * @returns {Promise<boolean>}
 */
export async function loggingMiddleware(context, next) {
  const { message } = context;

  logger.info('Message received', {
    userId: message.from?.id,
    chatId: message.chat?.id,
    text: message.text,
    type: message.chat?.type,
  });

  return next();
}

/**
 * Middleware для ограничения частоты запросов (Rate Limiting)
 * @param {number} maxRequests - Максимальное количество запросов
 * @param {number} windowMs - Окно времени в миллисекундах
 * @returns {Function} Функция middleware
 */
export function rateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();

  return async (context, next) => {
    const userId = context.message?.from?.id;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userRequests = requests.get(userId) || [];

    // Remove old requests outside window
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', { userId, count: validRequests.length });
      context.reply = {
        text: '⚠️ Слишком много запросов. Подождите немного.',
      };
      return false;
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    return next();
  };
}

/**
 * Middleware для проверки прав администратора
 * @param {Object} userRepository - Репозиторий пользователей
 * @returns {Function} Функция middleware
 */
export function adminOnlyMiddleware(userRepository) {
  return async (context, next) => {
    const userId = context.message?.from?.id;

    if (!userId) {
      return next();
    }

    try {
      const isAdmin = await userRepository.isAdmin(userId);

      if (!isAdmin) {
        logger.warn('Unauthorized admin access attempt', { userId });
        context.reply = {
          text: '❌ Эта команда доступна только администраторам',
        };
        return false;
      }
    } catch (error) {
      logger.error('Error checking admin status', error, { userId });
      context.reply = {
        text: '❌ Ошибка проверки прав доступа',
      };
      return false;
    }

    return next();
  };
}

/**
 * Middleware для аутентификации пользователя
 * Проверяет, существует ли пользователь в системе
 * @param {Object} userRepository - Репозиторий пользователей
 * @returns {Function} Функция middleware
 */
export function authMiddleware(userRepository) {
  return async (context, next) => {
    const userId = context.message?.from?.id;

    if (!userId) {
      return next();
    }

    try {
      // Создаем или получаем пользователя
      const user = await userRepository.getOrCreate(context.message.from);
      context.user = user;
    } catch (error) {
      logger.error('Error in auth middleware', error, { userId });
      context.reply = {
        text: '❌ Ошибка аутентификации',
      };
      return false;
    }

    return next();
  };
}

/**
 * Middleware для фильтрации по типу чата
 * @param {Array<string>} allowedTypes - Разрешенные типы чатов
 * @returns {Function} Функция middleware
 */
export function chatTypeMiddleware(allowedTypes = ['private', 'group', 'supergroup']) {
  return async (context, next) => {
    const chatType = context.message?.chat?.type;

    if (!chatType) {
      return next();
    }

    if (!allowedTypes.includes(chatType)) {
      logger.warn('Chat type not allowed', { chatType, allowedTypes });
      context.reply = {
        text: '⚠️ Эта команда недоступна в данном типе чата',
      };
      return false;
    }

    return next();
  };
}

/**
 * Middleware для защиты от спама
 * Проверяет частоту сообщений от пользователя
 * @param {number} minIntervalMs - Минимальный интервал между сообщениями
 * @returns {Function} Функция middleware
 */
export function spamProtectionMiddleware(minIntervalMs = 1000) {
  const lastMessages = new Map();

  return async (context, next) => {
    const userId = context.message?.from?.id;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const lastMessageTime = lastMessages.get(userId) || 0;

    if (now - lastMessageTime < minIntervalMs) {
      logger.warn('Spam detected', { userId, interval: now - lastMessageTime });
      context.reply = {
        text: '⚠️ Пожалуйста, не спамьте. Подождите немного.',
      };
      return false;
    }

    lastMessages.set(userId, now);
    return next();
  };
}

/**
 * Middleware для игнорирования команд
 * Пропускает сообщения, начинающиеся с '/'
 * @param {Object} context - Контекст выполнения
 * @param {Function} next - Следующая функция в цепочке
 * @returns {Promise<boolean>}
 */
export async function ignoreCommandsMiddleware(context, next) {
  if (context.message?.text && context.message.text.startsWith('/')) {
    logger.debug('Command ignored', { text: context.message.text });
    return false;
  }
  return next();
}

/**
 * Middleware для игнорирования сервисных сообщений
 * @param {Object} context - Контекст выполнения
 * @param {Function} next - Следующая функция в цепочке
 * @returns {Promise<boolean>}
 */
export async function ignoreServiceMessagesMiddleware(context, next) {
  if (!context.message?.from || !context.message?.chat) {
    logger.debug('Service message ignored');
    return false;
  }
  return next();
}

/**
 * Middleware для добавления метаданных в контекст
 * @param {Object} context - Контекст выполнения
 * @param {Function} next - Следующая функция в цепочке
 * @returns {Promise<boolean>}
 */
export async function metadataMiddleware(context, next) {
  context.metadata = {
    timestamp: Date.now(),
    messageId: context.message?.message_id,
    chatId: context.message?.chat?.id,
    userId: context.message?.from?.id,
  };
  return next();
}

/**
 * Фабрика для создания предустановленных пайплайнов
 */
export const MiddlewarePresets = {
  /**
   * Пайплайн для обработки сообщений
   */
  messagePipeline: (userRepository) => {
    return new MiddlewarePipeline()
      .use(loggingMiddleware)
      .use(validationMiddleware)
      .use(authMiddleware(userRepository))
      .use(ignoreCommandsMiddleware)
      .use(ignoreServiceMessagesMiddleware)
      .use(metadataMiddleware);
  },

  /**
   * Пайплайн для обработки команд администратора
   */
  adminCommandPipeline: (userRepository) => {
    return new MiddlewarePipeline()
      .use(loggingMiddleware)
      .use(validationMiddleware)
      .use(authMiddleware(userRepository))
      .use(adminOnlyMiddleware(userRepository));
  },

  /**
   * Пайплайн для обработки команд с ограничением частоты
   */
  rateLimitedPipeline: (userRepository, maxRequests = 100, windowMs = 60000) => {
    return new MiddlewarePipeline()
      .use(loggingMiddleware)
      .use(validationMiddleware)
      .use(authMiddleware(userRepository))
      .use(rateLimitMiddleware(maxRequests, windowMs));
  },

  /**
   * Пайплайн для групповых чатов
   */
  groupChatPipeline: (userRepository) => {
    return new MiddlewarePipeline()
      .use(loggingMiddleware)
      .use(validationMiddleware)
      .use(authMiddleware(userRepository))
      .use(chatTypeMiddleware(['group', 'supergroup']))
      .use(spamProtectionMiddleware());
  },
};

export default MiddlewarePipeline;
