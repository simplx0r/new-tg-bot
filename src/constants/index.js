export const COMMANDS = {
  START: '/start',
  HELP: '/help',
  JOKE: '/joke',
  STATS: '/stats',
  TOP: '/top',
  ALL_STATS: '/allstats',
  SUMMARY: '/summary',
  ADD_JOKE: '/addjoke',
  JOKES: '/jokes',
  JOKE_STATS: '/jokestats',
  JOKES_ON: '/jokeson',
  JOKES_OFF: '/jokesoff',
  SET_INTERVAL: '/setinterval',
  ADD_ADMIN: '/addadmin',
  REMOVE_ADMIN: '/removeadmin',
  ADMINS: '/admins',
  RANK: '/rank',
  RANKS: '/ranks',
  NOTIFY: '/notify',
  TOPICS: '/topics',
};

export const JOKE_CATEGORIES = {
  PROGRAMMING: 'programming',
  GENERAL: 'general',
  TECH: 'tech',
  WORK: 'work',
  ANIMALS: 'animals',
  LIFE: 'life',
  INTERVIEW: 'interview',
  AGENCY: 'agency',
};

export const RANK_CATEGORIES = {
  AGENCY: 'agency',
  INTERVIEW: 'interview',
};

export const REACTION_TYPES = {
  STICKER: 'sticker',
  MESSAGE: 'message',
};

export const CHAT_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group',
  SUPERGROUP: 'supergroup',
  CHANNEL: 'channel',
};

export const DEFAULT_SETTINGS = {
  JOKE_INTERVAL_MINUTES: 30,
  JOKES_ENABLED: true,
};

export const EMOJI = {
  ROBOT: '🤖',
  LAUGH: '😄',
  CHART: '📊',
  TROPHY: '🏆',
  GEAR: '⚙️',
  BOOK: '📖',
  CHECK: '✅',
  CROSS: '❌',
  INFO: 'ℹ️',
  BULB: '💡',
  FIRE: '🔥',
  STAR: '⭐',
  MEDAL_GOLD: '🥇',
  MEDAL_SILVER: '🥈',
  MEDAL_BRONZE: '🥉',
  AGENT: '🕵️',
  BRIEFCASE: '💼',
  CODE: '💻',
  SHIELD: '🛡️',
  BELL: '🔔',
  EYE: '👁️',
  USER: '👤',
  USERS: '👥',
  MESSAGE: '💬',
  CLOCK: '🕐',
  ARROW_RIGHT: '➡️',
  SPARKLES: '✨',
};

export const MESSAGES = {
  WELCOME: (name) => `👋 Добро пожаловать, ${name}!`,
  GOODBYE: (name) => `👋 ${name} покинул(а) чат`,
  ADMIN_ONLY: '❌ Эта команда доступна только админам',
  INVALID_INTERVAL: '❌ Интервал должен быть не менее 1 минуты',
  NO_JOKES: '😕 В базе пока нет шуток',
  COMMAND_NOT_FOUND: '❌ Команда не найдена',
  JOKES_ENABLED: '✅ Автоматические шутки включены',
  JOKES_DISABLED: '✅ Автоматические шутки выключены',
  INTERVAL_SET: (minutes) => `✅ Интервал установлен на ${minutes} минут(ы)`,
  ADMIN_ADDED: (userId) => `✅ Пользователь ${userId} добавлен в админы`,
  ADMIN_REMOVED: (userId) => `✅ Пользователь ${userId} удалён из админов`,
  NO_ADMINS: '😕 Список админов пуст',
  JOKE_ADDED: '✅ Шутка добавлена в базу!',
};

export const ERROR_MESSAGES = {
  DATABASE_ERROR: 'Ошибка базы данных',
  BOT_ERROR: 'Ошибка бота',
  INVALID_COMMAND: 'Неверная команда',
  MISSING_PARAMS: 'Отсутствуют обязательные параметры',
};
