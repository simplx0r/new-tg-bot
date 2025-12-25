export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

export class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.level = process.env.LOG_LEVEL || LOG_LEVELS.INFO;
  }

  error(message, error = null, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      this.log(LOG_LEVELS.ERROR, message, error, meta);
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      this.log(LOG_LEVELS.WARN, message, null, meta);
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      this.log(LOG_LEVELS.INFO, message, null, meta);
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      this.log(LOG_LEVELS.DEBUG, message, null, meta);
    }
  }

  log(level, message, error, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(error && { error: error.message, stack: error.stack }),
      ...meta,
    };

    // Console output (structured)
    console.log(JSON.stringify(logEntry));
  }

  shouldLog(level) {
    const levels = [LOG_LEVELS.ERROR, LOG_LEVELS.WARN, LOG_LEVELS.INFO, LOG_LEVELS.DEBUG];
    const currentIndex = levels.indexOf(this.level);
    const targetIndex = levels.indexOf(level);
    return targetIndex <= currentIndex;
  }

  setContext(context) {
    this.context = context;
  }

  setLevel(level) {
    if (Object.values(LOG_LEVELS).includes(level)) {
      this.level = level;
    }
  }

  child(context) {
    return new Logger(`${this.context}:${context}`);
  }
}

// Singleton logger instance
export const logger = new Logger('App');

export default Logger;
