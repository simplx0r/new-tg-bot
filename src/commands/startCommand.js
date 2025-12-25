import { COMMANDS, EMOJI } from '../constants/index.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

export function setupStartCommand(bot) {
  bot.onText(new RegExp(`^${COMMANDS.START}$`), (msg) => {
    const chatId = msg.chat.id;
    const message = `${EMOJI.ROBOT} Привет! Я бот для администрирования группы с шутками и статистикой.

${EMOJI.BOOK} Основные команды:
${EMOJI.ROBOT} /joke — получить случайную шутку
${EMOJI.CHART} /stats — твоя статистика
${EMOJI.TROPHY} /top — топ активных пользователей
${EMOJI.CHART} /allstats — статистика всех пользователей
${EMOJI.CHART} /summary — общая статистика чата
${EMOJI.AGENT} /rank — твоё текущее звание
${EMOJI.AGENT} /ranks — система званий

${EMOJI.GEAR} Команды для админов:
${EMOJI.GEAR} /addjoke <текст> — добавить шутку
${EMOJI.GEAR} /jokes — список всех шуток
${EMOJI.GEAR} /jokestats — статистика шуток
${EMOJI.GEAR} /jokeson — включить авто-шутки
${EMOJI.GEAR} /jokesoff — выключить авто-шутки
${EMOJI.GEAR} /setinterval <минуты> — интервал авто-шуток
${EMOJI.GEAR} /addadmin <user_id> — добавить админа
${EMOJI.GEAR} /removeadmin <user_id> — удалить админа
${EMOJI.GEAR} /admins — список админов
${EMOJI.BELL} /notify <текст> — уведомление всех

${EMOJI.BOOK} /help — справка`;

    safeSendMessage(bot, chatId, message);
  });
}
