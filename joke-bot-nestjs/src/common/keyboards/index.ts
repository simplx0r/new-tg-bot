import { Markup } from 'telegraf';
import type { ChatSettings } from '../../database/entities';

/**
 * Generate the main settings keyboard based on current settings
 */
export function settingsKeyboard(s: ChatSettings) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `🎭 Шутки: ${s.jokesEnabled ? '✅' : '❌'}`,
        'toggle_jokes',
      ),
      Markup.button.callback(
        `🎨 Стикеры: ${s.stickersEnabled ? '✅' : '❌'}`,
        'toggle_stickers',
      ),
    ],
    [
      Markup.button.callback(`⏰ Интервал: ${s.jokesInterval}м`, 'set_interval'),
      Markup.button.callback(`💬 Ответы: ${s.replyChance}%`, 'set_replychance'),
    ],
    [
      Markup.button.callback(`🎲 Режим: ${modeEmoji(s.broadcastMode)}`, 'set_mode'),
      Markup.button.callback('🔄 Обновить', 'refresh_settings'),
    ],
  ]);
}

/**
 * Mode selection keyboard
 */
export function modeKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🎭 Шутки', 'mode_jokes'),
      Markup.button.callback('🎨 Стикеры', 'mode_stickers'),
      Markup.button.callback('🎲 Микс', 'mode_mixed'),
    ],
    [Markup.button.callback('« Назад', 'back_to_settings')],
  ]);
}

/**
 * Interval selection keyboard
 */
export function intervalKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('5м', 'interval_5'),
      Markup.button.callback('15м', 'interval_15'),
      Markup.button.callback('30м', 'interval_30'),
    ],
    [
      Markup.button.callback('60м', 'interval_60'),
      Markup.button.callback('120м', 'interval_120'),
      Markup.button.callback('240м', 'interval_240'),
    ],
    [Markup.button.callback('« Назад', 'back_to_settings')],
  ]);
}

/**
 * Reply chance selection keyboard
 */
export function replyChanceKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('0%', 'chance_0'),
      Markup.button.callback('5%', 'chance_5'),
      Markup.button.callback('10%', 'chance_10'),
    ],
    [
      Markup.button.callback('15%', 'chance_15'),
      Markup.button.callback('25%', 'chance_25'),
      Markup.button.callback('50%', 'chance_50'),
    ],
    [Markup.button.callback('« Назад', 'back_to_settings')],
  ]);
}

/**
 * Main menu keyboard for regular users
 */
export function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🎭 Шутка', 'get_joke'),
      Markup.button.callback('🎱 8ball', 'get_8ball'),
    ],
    [
      Markup.button.callback('📊 Статистика', 'get_stats'),
      Markup.button.callback('🎖️ Ранг', 'get_rank'),
    ],
    [
      Markup.button.callback('🧙 Мудрость', 'get_wisdom'),
      Markup.button.callback('💬 Отмазка', 'get_excuse'),
    ],
  ]);
}

/**
 * Joke categories keyboard
 */
export function jokeCategoriesKeyboard(categories: string[]) {
  const buttons = categories.map((cat) =>
    Markup.button.callback(categoryEmoji(cat) + ' ' + cat, `joke_cat_${cat}`),
  );

  // Chunk into rows of 2
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  rows.push([Markup.button.callback('🎲 Случайная', 'joke_cat_random')]);

  return Markup.inlineKeyboard(rows);
}

function modeEmoji(mode: string): string {
  const map: Record<string, string> = {
    jokes: '🎭 Шутки',
    stickers: '🎨 Стикеры',
    mixed: '🎲 Микс',
  };
  return map[mode] ?? mode;
}

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    agent: '🕵️',
    shad: '📚',
    programming: '💻',
    general: '😂',
    dark: '🖤',
  };
  return map[cat] ?? '🎭';
}
