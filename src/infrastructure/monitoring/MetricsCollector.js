/**
 * Типы метрик
 */
export const MetricType = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
  TIMING: 'timing',
};

/**
 * Коллектор метрик
 * Собирает и хранит метрики производительности и использования
 */
export class MetricsCollector {
  /**
   * @param {Object} options - Опции коллектора
   * @param {boolean} options.enabled - Включён ли коллектор
   * @param {number} options.maxHistorySize - Максимальный размер истории
   */
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.maxHistorySize = options.maxHistorySize || 1000;

    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.timings = new Map();
  }

  /**
   * Инкрементировать счётчик
   * @param {string} name - Имя метрики
   * @param {number} value - Значение для инкремента
   * @param {Object} labels - Лейблы
   */
  increment(name, value = 1, labels = {}) {
    if (!this.enabled) {
      return;
    }

    const key = this._makeKey(name, labels);

    if (!this.counters.has(key)) {
      this.counters.set(key, {
        name,
        labels,
        value: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const counter = this.counters.get(key);
    counter.value += value;
    counter.updatedAt = Date.now();
  }

  /**
   * Установить значение gauge
   * @param {string} name - Имя метрики
   * @param {number} value - Значение
   * @param {Object} labels - Лейблы
   */
  gauge(name, value, labels = {}) {
    if (!this.enabled) {
      return;
    }

    const key = this._makeKey(name, labels);

    if (!this.gauges.has(key)) {
      this.gauges.set(key, {
        name,
        labels,
        value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const gauge = this.gauges.get(key);
    gauge.value = value;
    gauge.updatedAt = Date.now();
  }

  /**
   * Записать значение в гистограмму
   * @param {string} name - Имя метрики
   * @param {number} value - Значение
   * @param {Object} labels - Лейблы
   */
  histogram(name, value, labels = {}) {
    if (!this.enabled) {
      return;
    }

    const key = this._makeKey(name, labels);

    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        name,
        labels,
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const histogram = this.histograms.get(key);
    histogram.values.push(value);
    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);
    histogram.updatedAt = Date.now();

    // Ограничиваем размер истории
    if (histogram.values.length > this.maxHistorySize) {
      histogram.values.shift();
    }
  }

  /**
   * Записать время выполнения операции
   * @param {string} name - Имя метрики
   * @param {number} durationMs - Длительность в миллисекундах
   * @param {Object} labels - Лейблы
   */
  timing(name, durationMs, labels = {}) {
    if (!this.enabled) {
      return;
    }

    const key = this._makeKey(name, labels);

    if (!this.timings.has(key)) {
      this.timings.set(key, {
        name,
        labels,
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const timing = this.timings.get(key);
    timing.values.push(durationMs);
    timing.count++;
    timing.sum += durationMs;
    timing.min = Math.min(timing.min, durationMs);
    timing.max = Math.max(timing.max, durationMs);
    timing.avg = timing.sum / timing.count;

    // Вычисляем перцентили
    const sorted = [...timing.values].sort((a, b) => a - b);
    timing.p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    timing.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    timing.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    timing.updatedAt = Date.now();

    // Ограничиваем размер истории
    if (timing.values.length > this.maxHistorySize) {
      timing.values.shift();
    }
  }

  /**
   * Обернуть функцию для измерения времени выполнения
   * @param {string} name - Имя метрики
   * @param {Function} fn - Функция
   * @param {Object} labels - Лейблы
   * @returns {Promise<*>} Результат функции
   */
  async measure(name, fn, labels = {}) {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.timing(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.timing(name, duration, { ...labels, error: true });
      throw error;
    }
  }

  /**
   * Получить значение счётчика
   * @param {string} name - Имя метрики
   * @param {Object} labels - Лейблы
   * @returns {number|null} Значение
   */
  getCounter(name, labels = {}) {
    const key = this._makeKey(name, labels);
    const counter = this.counters.get(key);
    return counter ? counter.value : null;
  }

  /**
   * Получить значение gauge
   * @param {string} name - Имя метрики
   * @param {Object} labels - Лейблы
   * @returns {number|null} Значение
   */
  getGauge(name, labels = {}) {
    const key = this._makeKey(name, labels);
    const gauge = this.gauges.get(key);
    return gauge ? gauge.value : null;
  }

  /**
   * Получить статистику гистограммы
   * @param {string} name - Имя метрики
   * @param {Object} labels - Лейблы
   * @returns {Object|null} Статистика
   */
  getHistogram(name, labels = {}) {
    const key = this._makeKey(name, labels);
    const histogram = this.histograms.get(key);

    if (!histogram) {
      return null;
    }

    return {
      count: histogram.count,
      sum: histogram.sum,
      min: histogram.min,
      max: histogram.max,
      avg: histogram.count > 0 ? histogram.sum / histogram.count : 0,
    };
  }

  /**
   * Получить статистику таймингов
   * @param {string} name - Имя метрики
   * @param {Object} labels - Лейблы
   * @returns {Object|null} Статистика
   */
  getTiming(name, labels = {}) {
    const key = this._makeKey(name, labels);
    const timing = this.timings.get(key);

    if (!timing) {
      return null;
    }

    return {
      count: timing.count,
      sum: timing.sum,
      min: timing.min,
      max: timing.max,
      avg: timing.avg,
      p50: timing.p50,
      p95: timing.p95,
      p99: timing.p99,
    };
  }

  /**
   * Получить все метрики
   * @returns {Object} Все метрики
   */
  getAllMetrics() {
    return {
      counters: this._mapValues(this.counters),
      gauges: this._mapValues(this.gauges),
      histograms: this._mapValues(this.histograms),
      timings: this._mapValues(this.timings),
    };
  }

  /**
   * Сбросить все метрики
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timings.clear();
  }

  /**
   * Сбросить метрику по имени
   * @param {string} name - Имя метрики
   */
  resetMetric(name) {
    const prefix = `${name}:`;

    this.counters.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.counters.delete(key);
      }
    });

    this.gauges.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.gauges.delete(key);
      }
    });

    this.histograms.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.histograms.delete(key);
      }
    });

    this.timings.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.timings.delete(key);
      }
    });
  }

  /**
   * Создать ключ из имени и лейблов
   * @private
   * @param {string} name - Имя
   * @param {Object} labels - Лейблы
   * @returns {string} Ключ
   */
  _makeKey(name, labels) {
    const labelString = Object.keys(labels)
      .sort()
      .map((key) => `${key}=${labels[key]}`)
      .join(',');

    return labelString ? `${name}:${labelString}` : name;
  }

  /**
   * Преобразовать Map в массив значений
   * @private
   * @param {Map} map - Map
   * @returns {Array} Массив значений
   */
  _mapValues(map) {
    return Array.from(map.values());
  }
}

export default MetricsCollector;
