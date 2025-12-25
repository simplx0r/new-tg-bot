import { COMMANDS, EMOJI, JOKE_CATEGORIES } from '../constants/index.js';

export function setupHelpCommand(bot) {
  bot.onText(new RegExp(`^${COMMANDS.HELP}$`), (msg) => {
    const chatId = msg.chat.id;
    const message = `${EMOJI.BOOK} Справка по командам:

${EMOJI.LAUGH} Шутки:
/joke — получить случайную шутку
/joke <категория> — шутка из категории (${Object.values(JOKE_CATEGORIES).join(', ')})

${EMOJI.CHART} Статистика:
/stats — твоя статистика
/top — топ 10 активных пользователей
/top <N> — топ N активных пользователей
/allstats — статистика всех пользователей
/summary — общая статистика чата

${EMOJI.AGENT} Звания:
/rank — твоё текущее звание
/ranks — система званий

${EMOJI.GEAR} Админские команды:
/addjoke <текст> — добавить новую шутку
/jokes — список всех шуток в базе
/jokestats — статистика использования шуток
/jokeson — включить автоматические шутки
/jokesoff — выключить автоматические шутки
/setinterval <минуты> — установить интервал авто-шуток (в минутах)
/addadmin <user_id> — добавить пользователя в админы
/removeadmin <user_id> — удалить пользователя из админов
/admins — список всех админов

${EMOJI.BELL} Уведомления:
/notify <текст> — отправить уведомление всем (текст будет скрыт)

${EMOJI.BULB} Подсказка: Для получения user_id можно использовать бота @userinfobot`;

    bot.sendMessage(chatId, message);
  });
}
