import { Command, Ctx, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';

const WISDOM = [
  '«O(n²) — это не медленно, это тёплый ламповый алгоритм.» — Аноним из ШАДа',
  '«Если ты не можешь объяснить алгоритм бабушке, ты ещё не сеньор.» — Яндекс Recruiter',
  '«LeetCode hard — это easy после MLDS.» — Выпускник 2024',
  '«Три работы — это диверсификация дохода.» — Агент под прикрытием',
  '«Преждевременная оптимизация — корень всех зол.» — Дональд Кнут',
  '«Legacy код — это код который приносит деньги.» — Реалист',
  '«Работает? Не трогай!» — Мудрость дедов',
  '«Сначала сделай, потом оптимизируй.» — Никто никогда не слушал',
  '«Документацию пишут слабаки, сильные читают исходники.» — Тимлид в 3 ночи',
  '«Один созвон стоит тысячи сообщений в Slack.» — Никто никогда',
];

const EXCUSES = [
  'VPN глючит между работами',
  'Созвон наложился на созвон',
  'Яндекс.Практикум прислал домашку',
  'Готовлюсь к собесу в FAANG',
  'LeetCode не отпускает',
  'Код ревью на третьей работе',
  'Прод упал на второй работе',
  'CI/CD завис на 40 минут',
  'Ждём ответа от DevOps',
  'Legacy код сопротивляется',
  'Jira не грузится',
  'Git merge conflict на 500 файлов',
  'Тестовое задание для подстраховки',
  'ChatGPT выдал бред, переписываю',
  'Rubber duck отказывается помогать',
];

const MAGIC_8BALL = [
  '🎱 Деплой сегодня? Решай через динамику.',
  '🎱 Спроси в ШАД-чате.',
  '🎱 Это O(n²)? Тогда нет.',
  '🎱 Скажи что VPN упал.',
  '🎱 Работодатель номер 2 не одобряет.',
  '🎱 Определённо да, но сначала код ревью.',
  '🎱 Попробуй выключить и включить.',
  '🎱 Спроси у ChatGPT. Шучу, не спрашивай.',
  '🎱 Всё указывает на пятничный деплой.',
  '🎱 Лучше не сегодня.',
  '🎱 Мой внутренний алгоритм говорит: да.',
  '🎱 Сконцентрируйся и спроси снова.',
  '🎱 Откати и забудь.',
  '🎱 Это работа для джуна.',
];

const AGENT_STATUS = [
  '🟢 Online на работе #1, #2 на мьюте, #3 — "болею"',
  '🟡 Созвон в 3 окнах, камера выключена везде',
  '🔴 VPN переключается между континентами',
  '⚫ Stealth mode: все думают что я в отпуске',
  '🟢 Активен: решаю leetcode вместо работы',
  '🟡 Статус "пишу код", реальность: читаю Habr',
  '🔴 Дедлайн горит: на всех трёх работах',
  '⚫ Инкогнито: ни в одном Slack не отвечаю',
  '🟢 В митинге (на самом деле играю в 2048)',
  '🟡 "Проблемы с интернетом" (выбираю какой VPN включить)',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

@Update()
export class FunUpdate {
  @Command('wisdom')
  async onWisdom(@Ctx() ctx: Context): Promise<void> {
    const wisdom = randomFrom(WISDOM);
    await ctx.reply(`🧙 ${wisdom}`);
  }

  @Command('excuse')
  async onExcuse(@Ctx() ctx: Context): Promise<void> {
    const excuse = randomFrom(EXCUSES);
    await ctx.reply(`💬 Отмазка дня:\n\n"${excuse}"`);
  }

  @Command('8ball')
  async on8Ball(@Ctx() ctx: Context): Promise<void> {
    const answer = randomFrom(MAGIC_8BALL);
    await ctx.reply(answer);
  }

  @Command('status')
  async onStatus(@Ctx() ctx: Context): Promise<void> {
    const status = randomFrom(AGENT_STATUS);
    await ctx.reply(`📡 Статус агента:\n\n${status}`);
  }
}
