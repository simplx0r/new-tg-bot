import { logger } from '../logging/Logger.js';

/**
 * Типы задач для планировщика
 */
export const TaskType = {
  INTERVAL: 'interval',
  TIMEOUT: 'timeout',
  CRON: 'cron',
  ONCE: 'once',
};

/**
 * Статусы задач
 */
export const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

/**
 * Планировщик задач
 * Управляет выполнением задач по расписанию
 */
export class Scheduler {
  /**
   * @param {Object} options - Опции планировщика
   * @param {boolean} options.autoStart - Автоматический запуск
   */
  constructor(options = {}) {
    this.tasks = new Map();
    this.autoStart = options.autoStart !== false;
    this.isRunning = false;
  }

  /**
   * Запустить планировщик
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Scheduler started');
  }

  /**
   * Остановить планировщик
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    // Останавливаем все задачи
    this.tasks.forEach((task, taskId) => {
      this.cancel(taskId);
    });

    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Запланировать выполнение задачи с интервалом
   * @param {string} taskId - Уникальный ID задачи
   * @param {Function} task - Функция задачи
   * @param {number} intervalMs - Интервал в миллисекундах
   * @param {Object} options - Дополнительные опции
   * @param {boolean} options.immediate - Выполнить немедленно
   * @returns {string} ID задачи
   */
  scheduleInterval(taskId, task, intervalMs, options = {}) {
    if (this.tasks.has(taskId)) {
      throw new Error(`Task '${taskId}' already exists`);
    }

    const taskInfo = {
      id: taskId,
      type: TaskType.INTERVAL,
      task,
      interval: intervalMs,
      status: TaskStatus.PENDING,
      immediate: options.immediate || false,
      createdAt: Date.now(),
      lastRun: null,
      runCount: 0,
    };

    // Создаём interval
    const intervalId = setInterval(async () => {
      await this._executeTask(taskInfo);
    }, intervalMs);

    taskInfo.intervalId = intervalId;
    this.tasks.set(taskId, taskInfo);

    // Выполняем немедленно, если требуется
    if (options.immediate) {
      this._executeTask(taskInfo);
    }

    logger.info(`Interval task scheduled: ${taskId} (${intervalMs}ms)`);
    return taskId;
  }

  /**
   * Запланировать выполнение задачи через указанное время
   * @param {string} taskId - Уникальный ID задачи
   * @param {Function} task - Функция задачи
   * @param {number} delayMs - Задержка в миллисекундах
   * @returns {string} ID задачи
   */
  scheduleTimeout(taskId, task, delayMs) {
    if (this.tasks.has(taskId)) {
      throw new Error(`Task '${taskId}' already exists`);
    }

    const taskInfo = {
      id: taskId,
      type: TaskType.TIMEOUT,
      task,
      delay: delayMs,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      lastRun: null,
      runCount: 0,
    };

    // Создаём timeout
    const timeoutId = setTimeout(async () => {
      await this._executeTask(taskInfo);
    }, delayMs);

    taskInfo.timeoutId = timeoutId;
    this.tasks.set(taskId, taskInfo);

    logger.info(`Timeout task scheduled: ${taskId} (${delayMs}ms)`);
    return taskId;
  }

  /**
   * Запланировать выполнение задачи по cron-выражению
   * @param {string} taskId - Уникальный ID задачи
   * @param {Function} task - Функция задачи
   * @param {string} cronExpression - Cron-выражение
   * @returns {string} ID задачи
   */
  scheduleCron(taskId, task, cronExpression) {
    if (this.tasks.has(taskId)) {
      throw new Error(`Task '${taskId}' already exists`);
    }

    const taskInfo = {
      id: taskId,
      type: TaskType.CRON,
      task,
      cronExpression,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      lastRun: null,
      runCount: 0,
    };

    // Парсим cron и вычисляем следующий запуск
    const nextRun = this._parseCron(cronExpression);
    const delay = nextRun - Date.now();

    if (delay <= 0) {
      throw new Error('Cron expression must be in the future');
    }

    taskInfo.nextRun = nextRun;
    taskInfo.cronTimeoutId = setTimeout(async () => {
      await this._executeTask(taskInfo);
      // Респланируем для следующего запуска
      this._rescheduleCron(taskInfo);
    }, delay);

    this.tasks.set(taskId, taskInfo);

    logger.info(`Cron task scheduled: ${taskId} (${cronExpression})`);
    return taskId;
  }

  /**
   * Выполнить задачу один раз
   * @param {string} taskId - Уникальный ID задачи
   * @param {Function} task - Функция задачи
   * @param {number} delayMs - Задержка в миллисекундах
   * @returns {string} ID задачи
   */
  scheduleOnce(taskId, task, delayMs = 0) {
    if (this.tasks.has(taskId)) {
      throw new Error(`Task '${taskId}' already exists`);
    }

    const taskInfo = {
      id: taskId,
      type: TaskType.ONCE,
      task,
      delay: delayMs,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
      lastRun: null,
      runCount: 0,
    };

    const timeoutId = setTimeout(async () => {
      await this._executeTask(taskInfo);
      // Удаляем задачу после выполнения
      this.tasks.delete(taskId);
    }, delayMs);

    taskInfo.timeoutId = timeoutId;
    this.tasks.set(taskId, taskInfo);

    logger.info(`Once task scheduled: ${taskId} (${delayMs}ms)`);
    return taskId;
  }

  /**
   * Отменить задачу
   * @param {string} taskId - ID задачи
   * @returns {boolean} Успешность отмены
   */
  cancel(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      logger.warn(`Task '${taskId}' not found`);
      return false;
    }

    // Очищаем таймеры
    if (task.intervalId) {
      clearInterval(task.intervalId);
    }
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }
    if (task.cronTimeoutId) {
      clearTimeout(task.cronTimeoutId);
    }

    task.status = TaskStatus.CANCELLED;
    this.tasks.delete(taskId);

    logger.info(`Task cancelled: ${taskId}`);
    return true;
  }

  /**
   * Получить информацию о задаче
   * @param {string} taskId - ID задачи
   * @returns {Object|null} Информация о задаче
   */
  getTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      id: task.id,
      type: task.type,
      status: task.status,
      createdAt: task.createdAt,
      lastRun: task.lastRun,
      runCount: task.runCount,
      interval: task.interval,
      delay: task.delay,
      cronExpression: task.cronExpression,
      nextRun: task.nextRun,
    };
  }

  /**
   * Получить все задачи
   * @returns {Array} Список задач
   */
  getAllTasks() {
    return Array.from(this.tasks.keys()).map((taskId) => this.getTask(taskId));
  }

  /**
   * Выполнить задачу
   * @private
   * @param {Object} taskInfo - Информация о задаче
   */
  async _executeTask(taskInfo) {
    if (!this.isRunning) {
      return;
    }

    taskInfo.status = TaskStatus.RUNNING;
    taskInfo.lastRun = Date.now();

    try {
      await taskInfo.task();
      taskInfo.status = TaskStatus.PENDING;
      taskInfo.runCount++;
    } catch (error) {
      taskInfo.status = TaskStatus.FAILED;
      logger.error(`Task execution failed: ${taskInfo.id}`, error);
    }
  }

  /**
   * Респланировать cron-задачу
   * @private
   * @param {Object} taskInfo - Информация о задаче
   */
  _rescheduleCron(taskInfo) {
    const nextRun = this._parseCron(taskInfo.cronExpression);
    const delay = nextRun - Date.now();

    if (delay <= 0) {
      logger.warn(`Cron task '${taskInfo.id}' skipped (delay <= 0)`);
      return;
    }

    taskInfo.nextRun = nextRun;
    taskInfo.cronTimeoutId = setTimeout(async () => {
      await this._executeTask(taskInfo);
      this._rescheduleCron(taskInfo);
    }, delay);
  }

  /**
   * Парсить cron-выражение и вычислить следующий запуск
   * @private
   * @param {string} cronExpression - Cron-выражение
   * @returns {number} Время следующего запуска
   */
  _parseCron(cronExpression) {
    // Простая реализация для формата "*/N * * * *" (каждые N минут)
    const parts = cronExpression.split(' ');
    const minutePart = parts[0];

    if (minutePart.startsWith('*/')) {
      const interval = parseInt(minutePart.slice(2));
      const now = new Date();
      const nextMinute = Math.ceil(now.getMinutes() / interval) * interval;
      const nextRun = new Date(now);
      nextRun.setMinutes(nextMinute, 0, 0, 0);

      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 1);
      }

      return nextRun.getTime();
    }

    // По умолчанию - через 1 минуту
    return Date.now() + 60 * 1000;
  }
}

export default Scheduler;
