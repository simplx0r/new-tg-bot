import { COMMANDS, EMOJI, JOKE_CATEGORIES } from '../constants/index.js';
import { safeSendMessage } from '../utils/telegramHelpers.js';

export function setupHelpCommand(bot) {
  bot.onText(new RegExp(`^${COMMANDS.HELP}$`), (msg) => {
    const chatId = msg.chat.id;
    const message = `${EMOJI.BOOK} Справка по командам IT Agents:

${EMOJI.LAUGH} Шутки агентства:
/joke — получить случайную шутку
/joke <категория> — шутка из категории (${Object.values(JOKE_CATEGORIES).join(', ')})

${EMOJI.CHART} Оперативная статистика:
/stats — твоя статистика агента
/top — топ 10 самых активных агентов
/top <N> — топ N самых активных агентов
/allstats — статистика всех агентов
/summary — общая статистика миссий

${EMOJI.AGENT} Система званий:
/rank — твоё текущее звание в агентстве
/ranks — система званий IT Agents

${EMOJI.GEAR} Команды командиров:
/addjoke <текст> — добавить новую шутку в архив
/jokes — список всех шуток в базе агентства
/jokestats — статистика использования шуток
/jokeson — активировать автоматические шутки
/jokesoff — деактивировать автоматические шутки
/setinterval <минуты> — установить интервал авто-шуток (в минутах)
/addadmin <user_id> — назначить командира агентства
/removeadmin <user_id> — снять командира агентства
/admins — список всех командиров

${EMOJI.BELL} Секретные уведомления:
/notify <текст> — отправить секретное уведомление всем (текст будет скрыт)

${EMOJI.BULB} Подсказка: Для получения user_id можно использовать бота @userinfobot`;

    safeSendMessage(bot, chatId, message);
  });
}
