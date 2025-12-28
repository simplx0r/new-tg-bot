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

  return `${EMOJI.AGENT} Агент ${userName}
${EMOJI.CHART} Миссий выполнено: ${formatNumber(messageCount)}
${EMOJI.OPERATIVE} Звание: ${rank}
${EMOJI.CLOCK} Последняя активность: ${lastMessage}`;
}

export function formatTopUsers(users) {
  if (users.length === 0) {
    return `${EMOJI.CHART} Нет данных для отображения`;
  }

  let message = `${EMOJI.TROPHY} Топ самых активных агентов:\n\n`;

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
    message += `${medal} Агент ${userName}${rankText} — ${formatNumber(user.message_count)} миссий\n`;
  });

  return message;
}

export function formatAllStats(users) {
  if (users.length === 0) {
    return `${EMOJI.CHART} Нет данных для отображения`;
  }

  let message = `${EMOJI.CHART} Статистика агентства (${users.length} агентов):\n\n`;

  users.forEach((user, index) => {
    const userName = formatUserName(user);
    const lastMessage = formatDate(user.last_message_at);
    const rank = user.rank_name || 'Нет звания';
    message += `${index + 1}. Агент ${userName} [${rank}]\n   ${EMOJI.CHART} ${formatNumber(user.message_count)} миссий\n   ${EMOJI.CLOCK} ${lastMessage}\n\n`;
  });

  return message;
}

export function formatJokesList(jokes) {
  if (jokes.length === 0) {
    return `${EMOJI.BOOK} Архив агентства пуст`;
  }

  let message = `${EMOJI.BOOK} Архив шуток агентства (${jokes.length}):\n\n`;
  jokes.forEach((joke, index) => {
    const preview = joke.content.length > 50
      ? `${joke.content.substring(0, 50)}...`
      : joke.content;
    message += `${index + 1}. [${joke.category}] ${preview}\n`;
  });

  return message;
}

export function formatJokeStats(stats) {
  let message = `${EMOJI.CHART} Статистика шуток агентства:\n\n`;
  message += `${EMOJI.BOOK} Всего в архиве: ${formatNumber(stats.totalJokes)}\n`;
  message += `${EMOJI.TROPHY} Всего отправлено: ${formatNumber(stats.totalUsage)}\n\n`;
  message += `${EMOJI.BOOK} По категориям:\n`;

  Object.entries(stats.categoryStats).forEach(([category, data]) => {
    message += `  ${EMOJI.ARROW_RIGHT} ${category}: ${data.count} штук, ${data.usage} использований\n`;
  });

  return message;
}

export function formatChatSummary(summary) {
  return `${EMOJI.CHART} Общая статистика агентства:
${EMOJI.USERS} Агентов: ${formatNumber(summary.totalUsers)}
${EMOJI.MESSAGE} Миссий выполнено: ${formatNumber(summary.totalMessages)}
${EMOJI.TROPHY} Самый активный агент: ${summary.mostActiveName} (${formatNumber(summary.mostActiveCount)} миссий)`;
}

export function formatRanksList(ranks) {
  if (ranks.length === 0) {
    return `${EMOJI.AGENT} Список званий пуст`;
  }

  let message = `${EMOJI.AGENT} Система званий IT Agents:\n\n`;

  ranks.forEach((rank, index) => {
    const emoji = rank.category === 'agency' ? EMOJI.SHIELD : EMOJI.BRIEFCASE;
    message += `${index + 1}. ${emoji} ${rank.name}\n`;
    message += `   ${EMOJI.MESSAGE} Мин. миссий: ${formatNumber(rank.minMessages)}\n`;
    message += `   ${EMOJI.CODE} Категория: ${rank.category}\n\n`;
  });

  return message;
}

export function formatAdminsList(admins) {
  if (admins.length === 0) {
    return `${EMOJI.AGENT} Список командиров пуст`;
  }

  let message = `${EMOJI.AGENT} Список командиров агентства:\n\n`;
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
