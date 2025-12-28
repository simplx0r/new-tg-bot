/**
 * Валидатор конфигурации
 * Проверяет корректность настроек приложения
 */
export class ConfigValidator {
  /**
   * Валидировать конфигурацию
   * @param {Object} config - Конфигурация
   * @returns {Object} Результат валидации
   */
  static validate(config) {
    const errors = [];
    const warnings = [];

    // Валидация Telegram конфигурации
    if (!config.telegram) {
      errors.push('Missing telegram configuration');
    } else if (!config.telegram.token) {
      errors.push('Telegram token is required');
    } else if (!this._isValidBotToken(config.telegram.token)) {
      errors.push('Invalid Telegram bot token format');
    }

    // Валидация конфигурации базы данных
    if (!config.database) {
      errors.push('Missing database configuration');
    } else if (!config.database.path) {
      errors.push('Database path is required');
    } else if (!this._isValidPath(config.database.path)) {
      warnings.push('Database path may be invalid');
    }

    // Валидация настроек бота
    if (config.bot) {
      if (config.bot.defaultTopicId && !this._isValidNumber(config.bot.defaultTopicId)) {
        warnings.push('Invalid default topic ID');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Проверить формат токена бота
   * @private
   * @param {string} token - Токен
   * @returns {boolean} Валидный ли токен
   */
  static _isValidBotToken(token) {
    // Формат: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
    return /^\d+:[A-Za-z0-9_-]{35}$/.test(token);
  }

  /**
   * Проверить валидность пути
   * @private
   * @param {string} path - Путь
   * @returns {boolean} Валидный ли путь
   */
  static _isValidPath(path) {
    return typeof path === 'string' && path.length > 0;
  }

  /**
   * Проверить валидность числа
   * @private
   * @param {*} value - Значение
   * @returns {boolean} Валидное ли число
   */
  static _isValidNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value) && value > 0;
  }
}

export default ConfigValidator;
