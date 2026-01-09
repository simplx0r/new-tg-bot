import type { Joke } from '../entities';

type JokeSeed = Pick<Joke, 'content' | 'category'>;

export const AGENT_JOKES: JokeSeed[] = [
  // 🕵️ МНОГОРАБОТНИЧЕСТВО / SECRET AGENTS
  {
    content:
      'Статус: работаю в 3 компаниях. Миссия: не попасть на созвон одновременно.',
    category: 'agent',
  },
  {
    content:
      '— Сколько у тебя работ?\n— Это секретная информация.\n— Понял, больше трёх.',
    category: 'agent',
  },
  {
    content:
      'Агент 007 — это я после обеда. 0 задач закрыто, 0 PR замержено, 7 созвонов.',
    category: 'agent',
  },
  {
    content:
      'Мой VPN-трафик: первая работа → вторая работа → третья работа → LinkedIn искать четвёртую.',
    category: 'agent',
  },
  {
    content: 'Многостаночник — это не профессия, это lifestyle.',
    category: 'agent',
  },
  {
    content:
      '— Почему ты всегда на мьюте?\n— Я на другом созвоне. На каком? На секретном.',
    category: 'agent',
  },
  {
    content:
      'Коллеги думают я в отпуске. Другие коллеги думают я болею. Третьи — что я на конфе.',
    category: 'agent',
  },
  {
    content: 'Work-life balance: 3 работы — 0 жизни.',
    category: 'agent',
  },
  {
    content:
      'Мое резюме в 3 версиях: junior, middle, senior. Для каждой компании своё.',
    category: 'agent',
  },
  {
    content:
      'На первой работе я Алексей, на второй — Alex, на третьей — @anonymous_dev.',
    category: 'agent',
  },
  {
    content:
      'Секретный агент IT: днём фиксит баги на проде, ночью — на другом проде.',
    category: 'agent',
  },
  {
    content: 'Мой Slack: 5 воркспейсов, 0 прочитанных сообщений, 100% guilt.',
    category: 'agent',
  },

  // 📚 ШАД / MLDS / ЯНДЕКС КУЛЬТ
  {
    content: 'Окончил ШАД. Теперь дрочу на алгосы профессионально.',
    category: 'shad',
  },
  {
    content:
      '— Какой у тебя background?\n— ШАД.\n— Понял, алгосы — твоя религия.',
    category: 'shad',
  },
  {
    content: 'MLDS выпускник на собесе: "А можно решить через трансформеры?"',
    category: 'shad',
  },
  {
    content:
      'ШАДовец vs обычный разраб: один пишет O(n), другой — O(n log n) для красоты.',
    category: 'shad',
  },
  {
    content: 'После ШАДа любая задача — это либо динамика, либо графы.',
    category: 'shad',
  },
  {
    content:
      '— Ты готов к собесу?\n— Хз, решил только 500 задач на LeetCode.\n— ШАД момент.',
    category: 'shad',
  },
  {
    content: 'Яндекс отказал. Пойду в Google, там попроще.',
    category: 'shad',
  },
  {
    content:
      'ШАД научил меня главному: даже если решение O(1), ревьюер найдёт к чему придраться.',
    category: 'shad',
  },
  {
    content: 'MLDS homework: "простая задачка на 40 часов".',
    category: 'shad',
  },
  {
    content:
      '— Чем занимаешься?\n— Дрочу на алгосы.\n— Это работа?\n— Это образ жизни.',
    category: 'shad',
  },
  {
    content:
      'Выпускник ШАДа: "Это же базовый алгоритм!"\nВсе остальные: *гуглят что такое B-дерево*',
    category: 'shad',
  },
  {
    content:
      'LeetCode Premium — это как Netflix, только смотришь на красные кружочки.',
    category: 'shad',
  },

  // 💼 ОБЩИЙ IT ЮМОР
  {
    content: '"Это не баг, это фича" — официальный гимн продакшена.',
    category: 'general',
  },
  {
    content: 'Пятничный деплой: русская рулетка для айтишников.',
    category: 'general',
  },
  {
    content: 'Legacy код: археологические раскопки с дедлайном.',
    category: 'general',
  },
  {
    content: 'Созвон который мог быть письмом, но стал часом жизни.',
    category: 'general',
  },
  {
    content: 'Документация: "See implementation for details".',
    category: 'general',
  },
  {
    content:
      'Code review: найти запятую и оставить 47 комментариев про архитектуру.',
    category: 'general',
  },
  {
    content: '— Почему ты в IT?\n— Я общительный.\n— ???\n— С компьютерами.',
    category: 'general',
  },
  {
    content: 'Standup: 14 человек отвечают "то же самое" после первого.',
    category: 'general',
  },
  {
    content: 'Jira: где таски уходят доживать свой век.',
    category: 'general',
  },
  {
    content: '"Быстрый фикс" — известные последние слова.',
    category: 'general',
  },
  {
    content: 'git blame — самая честная команда в IT.',
    category: 'general',
  },
  {
    content: 'Senior разработчик: тот кто гуглит быстрее.',
    category: 'general',
  },
];
