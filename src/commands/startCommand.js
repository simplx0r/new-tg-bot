import { COMMANDS, EMOJI } from '../constants/index.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

export function setupStartCommand(bot) {
  bot.onText(new RegExp(`^${COMMANDS.START}$`), (msg) => {
    const chatId = msg.chat.id;
    const message = `${EMOJI.ROBOT} Привет, агент! Добро пожаловать в IT Agents — секретное агентство по live-помощи на технических собеседованиях.

${EMOJI.BOOK} Основные команды:
${EMOJI.LAUGH} /joke — получить случайную шутку агентства
${EMOJI.CHART} /stats — твоя оперативная статистика
${EMOJI.TROPHY} /top — топ самых активных агентов
${EMOJI.CHART} /allstats — статистика всех агентов
${EMOJI.CHART} /summary — общая статистика миссий
${EMOJI.AGENT} /rank — твоё текущее звание в агентстве
${EMOJI.AGENT} /ranks — система званий IT Agents

${EMOJI.GEAR} Команды для командиров:
${EMOJI.GEAR} /addjoke <текст> — добавить шутку в базу агентства
${EMOJI.GEAR} /jokes — список всех шуток в архиве
${EMOJI.GEAR} /jokestats — статистика использования шуток
${EMOJI.GEAR} /jokeson — активировать авто-шутки
${EMOJI.GEAR} /jokesoff — деактивировать авто-шутки
${EMOJI.GEAR} /setinterval <минуты> — интервал авто-шуток
${EMOJI.GEAR} /addadmin <user_id> — назначить командира
${EMOJI.GEAR} /removeadmin <user_id> — снять командира
${EMOJI.GEAR} /admins — список командиров агентства
${EMOJI.BELL} /notify <текст> — секретное уведомление всех

${EMOJI.BOOK} /help — справка по командам агентства`;

    safeSendMessage(bot, chatId, message);
  });
}
