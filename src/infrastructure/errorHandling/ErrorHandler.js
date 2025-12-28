import { logger } from '../logging/Logger.js';
import { ErrorEvent } from '../../domain/events/TypedEvent.js';

/**
 * Классификация ошибок
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Категории ошибок
 */
export const ErrorCategory = {
  TELEGRAM_API: 'telegram_api',
  DATABASE: 'database',
  VALIDATION: 'validation',
  AUTHORIZATION: 'authorization',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  UNKNOWN: 'unknown',
};

/**
 * Централизованный обработчик ошибок
 * Обеспечивает единый подход к обработке, логированию и уведомлению об ошибках
 */
export class ErrorHandler {
  /**
   * @param {Object} options - Опции обработчика
   * @param {Object} options.eventDispatcher - Диспетчер событий
   * @param {Function} options.notificationCallback - Callback для уведомлений
   * @param {boolean} options.logToConsole - Логировать в консоль
   * @param {boolean} options.dispatchEvents - Отправлять события об ошибках
   */
  constructor(options = {}) {
    this.eventDispatcher = options.eventDispatcher;
    this.notificationCallback = options.notificationCallback;
    this.logToConsole = options.logToConsole !== false;
    this.dispatchEvents = options.dispatchEvents !== false;

    this.errorStats = new Map();
    this.errorHandlers = new Map();
  }

  /**
   * Обработать ошибку
   * @param {Error} error - Ошибка
   * @param {Object} context - Контекст ошибки
   * @param {Object} options - Дополнительные опции
   * @returns {Object} Результат обработки
   */
  async handle(error, context = {}, options = {}) {
    const errorInfo = this._classifyError(error, context);

    // Обновляем статистику
    this._updateErrorStats(errorInfo);

    // Логируем ошибку
    if (this.logToConsole) {
      this._logError(errorInfo);
    }

    // Отправляем событие об ошибке
    if (this.dispatchEvents && this.eventDispatcher) {
      await this._dispatchErrorEvent(errorInfo);
    }

    // Вызываем пользовательский обработчик, если есть
    const customHandler = this.errorHandlers.get(errorInfo.category);
    if (customHandler) {
      await customHandler(errorInfo, context);
    }

    // Отправляем уведомление, если критическая ошибка
    if (errorInfo.severity === ErrorSeverity.CRITICAL && this.notificationCallback) {
      await this.notificationCallback(errorInfo, context);
    }

    return {
      handled: true,
      severity: errorInfo.severity,
      category: errorInfo.category,
      shouldRetry: errorInfo.category === ErrorCategory.TELEGRAM_API
        || errorInfo.category === ErrorCategory.DATABASE,
    };
  }

  /**
   * Зарегистрировать обработчик для категории ошибок
   * @param {string} category - Категория ошибки
   * @param {Function} handler - Обработчик
   */
  registerHandler(category, handler) {
    this.errorHandlers.set(category, handler);
  }

  /**
   * Удалить обработчик для категории ошибок
   * @param {string} category - Категория ошибки
   */
  unregisterHandler(category) {
    this.errorHandlers.delete(category);
  }

  /**
   * Получить статистику ошибок
   * @returns {Object} Статистика
   */
  getStats() {
    const stats = {};
    this.errorStats.forEach((value, key) => {
      stats[key] = {
        ...value,
        rate: value.count / (value.lastOccurrence - value.firstOccurrence || 1) * 1000,
      };
    });
    return stats;
  }

  /**
   * Сбросить статистику ошибок
   */
  resetStats() {
    this.errorStats.clear();
  }

  /**
   * Классифицировать ошибку
   * @private
   * @param {Error} error - Ошибка
   * @param {Object} context - Контекст
   * @returns {Object} Информация об ошибке
   */
  _classifyError(error, context) {
    const now = Date.now();
    const info = {
      error,
      message: error.message,
      stack: error.stack,
      code: error.code,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.UNKNOWN,
      context,
      timestamp: now,
    };

    // Классифицируем по коду ошибки
    if (error.code === 'ETELEGRAM') {
      info.category = ErrorCategory.TELEGRAM_API;
      const description = error.response?.body?.description;

      // Некритичные ошибки Telegram
      const nonCriticalErrors = [
        'TOPIC_CLOSED',
        'USER_DEACTIVATED',
        'CHAT_WRITE_FORBIDDEN',
        'BOT_BLOCKED',
        'MESSAGE_TO_DELETE_NOT_FOUND',
        'MESSAGE_NOT_MODIFIED',
      ];

      if (nonCriticalErrors.some((err) => description?.includes(err))) {
        info.severity = ErrorSeverity.LOW;
      } else {
        info.severity = ErrorSeverity.HIGH;
      }
    } else if (error.code === 'SQLITE_ERROR' || error.code === 'SQLITE_CONSTRAINT') {
      info.category = ErrorCategory.DATABASE;
      info.severity = ErrorSeverity.HIGH;
    } else if (error.name === 'ValidationError') {
      info.category = ErrorCategory.VALIDATION;
      info.severity = ErrorSeverity.LOW;
    } else if (error.name === 'AuthorizationError') {
      info.category = ErrorCategory.AUTHORIZATION;
      info.severity = ErrorSeverity.MEDIUM;
    } else if (error.name === 'BusinessLogicError') {
      info.category = ErrorCategory.BUSINESS_LOGIC;
      info.severity = ErrorSeverity.MEDIUM;
    } else if (error.name === 'SystemError') {
      info.category = ErrorCategory.SYSTEM;
      info.severity = ErrorSeverity.CRITICAL;
    }

    return info;
  }

  /**
   * Обновить статистику ошибок
   * @private
   * @param {Object} errorInfo - Информация об ошибке
   */
  _updateErrorStats(errorInfo) {
    const key = `${errorInfo.category}:${errorInfo.message}`;
    const now = Date.now();

    if (!this.errorStats.has(key)) {
      this.errorStats.set(key, {
        category: errorInfo.category,
        message: errorInfo.message,
        count: 0,
        firstOccurrence: now,
        lastOccurrence: now,
      });
    }

    const stats = this.errorStats.get(key);
    stats.count++;
    stats.lastOccurrence = now;
  }

  /**
   * Логировать ошибку
   * @private
   * @param {Object} errorInfo - Информация об ошибке
   */
  _logError(errorInfo) {
    const logMethod = {
      [ErrorSeverity.LOW]: 'warn',
      [ErrorSeverity.MEDIUM]: 'error',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'fatal',
    }[errorInfo.severity];

    logger[logMethod](
      `Error [${errorInfo.category}]`,
      errorInfo.message,
      {
        severity: errorInfo.severity,
        code: errorInfo.code,
        context: errorInfo.context,
      },
    );
  }

  /**
   * Отправить событие об ошибке
   * @private
   * @param {Object} errorInfo - Информация об ошибке
   */
  async _dispatchErrorEvent(errorInfo) {
    try {
      const event = new ErrorEvent({
        error: errorInfo.error,
        context: errorInfo.context,
        metadata: {
          severity: errorInfo.severity,
          category: errorInfo.category,
        },
      });

      await this.eventDispatcher.dispatch(event);
    } catch (err) {
      logger.error('Failed to dispatch error event', err);
    }
  }
}

export default ErrorHandler;
