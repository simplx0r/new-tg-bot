/**
 * Политика кэширования
 */
export const CachePolicy = {
  /**
   * Кэшировать на короткое время (1 минута)
   */
  SHORT: 60 * 1000,
  /**
   * Кэшировать на среднее время (5 минут)
   */
  MEDIUM: 5 * 60 * 1000,
  /**
   * Кэшировать на длительное время (1 час)
   */
  LONG: 60 * 60 * 1000,
  /**
   * Кэшировать очень долго (24 часа)
   */
  VERY_LONG: 24 * 60 * 60 * 1000,
};

/**
 * Сервис кэширования
 * Поддерживает TTL, LRU eviction и статистику
 */
export class CacheService {
  /**
   * @param {Object} options - Опции кэша
   * @param {number} options.maxSize - Максимальный размер кэша
   * @param {number} options.defaultTTL - Время жизни по умолчанию
   * @param {boolean} options.enabled - Включён ли кэш
   */
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || CachePolicy.MEDIUM;
    this.enabled = options.enabled !== false;

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };
  }

  /**
   * Получить значение из кэша
   * @param {string} key - Ключ
   * @returns {*} Значение или null
   */
  get(key) {
    if (!this.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Проверяем TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Обновляем lastAccessed для LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Установить значение в кэш
   * @param {string} key - Ключ
   * @param {*} value - Значение
   * @param {number} ttl - Время жизни в миллисекундах
   */
  set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) {
      return;
    }

    // Проверяем размер и удаляем старые записи (LRU)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }

    const expiresAt = ttl > 0 ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    });

    this.stats.sets++;
  }

  /**
   * Удалить значение из кэша
   * @param {string} key - Ключ
   * @returns {boolean} Успешность удаления
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Проверить наличие ключа в кэше
   * @param {string} key - Ключ
   * @returns {boolean} Существует ли ключ
   */
  has(key) {
    if (!this.enabled) {
      return false;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Проверяем TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Получить или вычислить значение
   * @param {string} key - Ключ
   * @param {Function} factory - Функция для вычисления значения
   * @param {number} ttl - Время жизни
   * @returns {*} Значение
   */
  async getOrSet(key, factory, ttl = this.defaultTTL) {
    const cached = this.get(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);

    return value;
  }

  /**
   * Очистить весь кэш
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Очистить просроченные записи
   * @returns {number} Количество удалённых записей
   */
  cleanup() {
    let deleted = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Получить статистику кэша
   * @returns {Object} Статистика
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate.toFixed(2)}%`,
    };
  }

  /**
   * Сбросить статистику
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
    };
  }

  /**
   * Удалить запись по LRU (Least Recently Used)
   * @private
   */
  _evictLRU() {
    let oldestKey = null;
    let oldestAccessed = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestAccessed) {
        oldestAccessed = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
}

/**
 * Декоратор для кэширования результатов методов
 * @param {string} keyPrefix - Префикс ключа
 * @param {number} ttl - Время жизни
 * @returns {Function} Декоратор
 */
export function cached(keyPrefix, ttl = CachePolicy.MEDIUM) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const cacheService = new CacheService();

    descriptor.value = async function (...args) {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;

      const cached = cacheService.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cacheService.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

export default CacheService;
