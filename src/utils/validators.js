export function isValidUserId(userId) {
  return typeof userId === 'number' && userId > 0;
}

export function isValidChatId(chatId) {
  return typeof chatId === 'number' && chatId > 0;
}

export function isValidInterval(interval) {
  return typeof interval === 'number' && interval >= 1;
}

export function isValidJokeContent(content) {
  return typeof content === 'string' && content.trim().length > 0;
}

export function isValidCategory(category, allowedCategories) {
  return typeof category === 'string' && allowedCategories.includes(category);
}

export function isValidCommand(text) {
  return typeof text === 'string' && text.startsWith('/');
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') { return ''; }
  return input.trim().replace(/[<>]/g, '');
}

export function validateMessage(msg) {
  if (!msg) {
    throw new Error('Сообщение не существует');
  }

  if (!msg.from) {
    throw new Error('Отсутствует информация об отправителе');
  }

  if (!msg.chat) {
    throw new Error('Отсутствует информация о чате');
  }

  return true;
}

export function validateAdminAccess(userId, db) {
  if (!db.isAdmin(userId)) {
    throw new Error('Доступ запрещён: требуется права администратора');
  }

  return true;
}

export function parseCommand(text, commandPattern) {
  const match = text.match(commandPattern);
  if (!match) {
    return null;
  }

  return {
    fullMatch: match[0],
    params: match.slice(1).filter(Boolean),
  };
}

export function extractJokeContent(text) {
  const match = text.match(/^\/addjoke\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function extractUserId(text) {
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function extractInterval(text) {
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function extractCategory(text) {
  const match = text.match(/^\/joke\s+(\w+)$/i);
  return match ? match[1].toLowerCase() : null;
}

export function extractTopLimit(text) {
  const match = text.match(/^\/top\s+(\d+)$/i);
  return match ? Number(match[1]) : 10;
}
