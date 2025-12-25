import { EMOJI } from '../constants/index.js';

export function formatUserName(user) {
  if (user.username) {
    return `@${user.username}`;
  }
  if (user.first_name) {
    return user.first_name;
  }
  return 'Пользователь';
}

export function formatDate(date) {
  if (!date) {
    return 'Нет данных';
  }
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU').format(num);
}

export function formatUserStats(user) {
  const userName = formatUserName(user);
  const messageCount = user.message_count || 0;
  const lastMessage = formatDate(user.last_message_at);
  const rank = user.rank_name || 'Нет звания';

  return `${EMOJI.USER} ${userName}
${EMOJI.CHART} Сообщений: ${formatNumber(messageCount)}
${EMOJI.AGENT} Звание: ${rank}
${EMOJI.CLOCK} Последнее сообщение: ${lastMessage}`;
}

export function formatTopUsers(users) {
  if (users.length === 0) {
    return `${EMOJI.CHART} Нет данных для отображения`;
  }

  let message = `${EMOJI.TROPHY} Топ активных пользователей:\n\n`;

  users.forEach((user, index) => {
    const userName = formatUserName(user);
    let medal;
    if (index === 0) {
      medal = EMOJI.MEDAL_GOLD;
    } else if (index === 1) {
      medal = EMOJI.MEDAL_SILVER;
    } else if (index === 2) {
      medal = EMOJI.MEDAL_BRONZE;
    } else {
      medal = `${index + 1}.`;
    }
    const rank = user.rank_name || '';
    const rankText = rank ? ` [${rank}]` : '';
    message += `${medal} ${userName}${rankText} — ${formatNumber(user.message_count)} сообщений\n`;
  });

  return message;
}

export function formatAllStats(users) {
  if (users.length === 0) {
    return `${EMOJI.CHART} Нет данных для отображения`;
  }

  let message = `${EMOJI.CHART} Статистика чата (${users.length} пользователей):\n\n`;

  users.forEach((user, index) => {
    const userName = formatUserName(user);
    const lastMessage = formatDate(user.last_message_at);
    const rank = user.rank_name || 'Нет звания';
    message += `${index + 1}. ${userName} [${rank}]\n   ${EMOJI.CHART} ${formatNumber(user.message_count)} сообщений\n   ${EMOJI.CLOCK} ${lastMessage}\n\n`;
  });

  return message;
}

export function formatJokesList(jokes) {
  if (jokes.length === 0) {
    return `${EMOJI.BOOK} Список пуст`;
  }

  let message = `${EMOJI.BOOK} Список шуток (${jokes.length}):\n\n`;
  jokes.forEach((joke, index) => {
    const preview = joke.content.length > 50
      ? `${joke.content.substring(0, 50)}...`
      : joke.content;
    message += `${index + 1}. [${joke.category}] ${preview}\n`;
  });

  return message;
}

export function formatJokeStats(stats) {
  let message = `${EMOJI.CHART} Статистика шуток:\n\n`;
  message += `${EMOJI.BOOK} Всего шуток: ${formatNumber(stats.totalJokes)}\n`;
  message += `${EMOJI.TROPHY} Всего отправлено: ${formatNumber(stats.totalUsage)}\n\n`;
  message += `${EMOJI.BOOK} По категориям:\n`;

  Object.entries(stats.categoryStats).forEach(([category, data]) => {
    message += `  ${EMOJI.ARROW_RIGHT} ${category}: ${data.count} штук, ${data.usage} использований\n`;
  });

  return message;
}

export function formatChatSummary(summary) {
  return `${EMOJI.CHART} Общая статистика чата:
${EMOJI.USERS} Пользователей: ${formatNumber(summary.totalUsers)}
${EMOJI.MESSAGE} Всего сообщений: ${formatNumber(summary.totalMessages)}
${EMOJI.TROPHY} Самый активный: ${summary.mostActiveName} (${formatNumber(summary.mostActiveCount)} сообщений)`;
}

export function formatRanksList(ranks) {
  if (ranks.length === 0) {
    return `${EMOJI.AGENT} Список званий пуст`;
  }

  let message = `${EMOJI.AGENT} Система званий:\n\n`;

  ranks.forEach((rank, index) => {
    const emoji = rank.category === 'agency' ? EMOJI.SHIELD : EMOJI.BRIEFCASE;
    message += `${index + 1}. ${emoji} ${rank.name}\n`;
    message += `   ${EMOJI.MESSAGE} Мин. сообщений: ${formatNumber(rank.minMessages)}\n`;
    message += `   ${EMOJI.CODE} Категория: ${rank.category}\n\n`;
  });

  return message;
}

export function formatAdminsList(admins) {
  if (admins.length === 0) {
    return `${EMOJI.AGENT} Список админов пуст`;
  }

  let message = `${EMOJI.AGENT} Список админов:\n\n`;
  admins.forEach((admin, index) => {
    message += `${index + 1}. ID: ${admin.telegram_id}\n`;
  });

  return message;
}

export function createSpoilerText(text) {
  return `<tg-spoiler>${text}</tg-spoiler>`;
}

export function createBoldText(text) {
  return `<b>${text}</b>`;
}

export function createItalicText(text) {
  return `<i>${text}</i>`;
}

export function createCodeText(text) {
  return `<code>${text}</code>`;
}

export function createPreText(text) {
  return `<pre>${text}</pre>`;
}

export function createLink(text, url) {
  return `<a href="${url}">${text}</a>`;
}

export function createMention(username) {
  return `@${username}`;
}
