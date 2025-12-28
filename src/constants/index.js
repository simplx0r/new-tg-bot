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
  // New emojis for IT Agents theme
  HEADPHONES: '🎧',
  CLIPBOARD: '📋',
  CHATGPT: '🤖',
  INTERVIEW: '💼',
  MISSION: '🎯',
  SECRET: '🔒',
  OPERATIVE: '🎖️',
  RECRUIT: '📋',
};

export const MESSAGES = {
  WELCOME: (name) => `🕵️ Добро пожаловать в IT Agents, ${name}! Готов к миссиям?`,
  GOODBYE: (name) => `👋 Агент ${name} покинул оперативную зону`,
  ADMIN_ONLY: '❌ Доступ разрешён только командиру агентства',
  INVALID_INTERVAL: '❌ Интервал миссии должен быть не менее 1 минуты',
  NO_JOKES: '😕 База шуток агентства пуста. Добавьте их командой /addjoke',
  COMMAND_NOT_FOUND: '❌ Команда не распознана. Проверьте шифр!',
  JOKES_ENABLED: '✅ Автоматические шутки активированы',
  JOKES_DISABLED: '✅ Автоматические шутки деактивированы',
  INTERVAL_SET: (minutes) => `✅ Интервал миссии установлен на ${minutes} минут(ы)`,
  ADMIN_ADDED: (userId) => `✅ Агент ${userId} назначен командиром`,
  ADMIN_REMOVED: (userId) => `✅ Агент ${userId} снят с должности командира`,
  NO_ADMINS: '😕 Список командиров пуст',
  JOKE_ADDED: '✅ Шутка добавлена в базу агентства!',
};

export const ERROR_MESSAGES = {
  DATABASE_ERROR: 'Ошибка базы данных агентства',
  BOT_ERROR: 'Сбой в системе связи агентства',
  INVALID_COMMAND: 'Неверный код команды',
  MISSING_PARAMS: 'Отсутствуют обязательные параметры миссии',
};
