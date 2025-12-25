import { EMOJI } from '../constants/index.js';
import { getJokeByCategory, getRandomJoke } from '../data/jokes.js';
import { formatJokeStats, formatJokesList } from '../utils/formatters.js';

class JokeService {
  constructor(db) {
    this.db = db;
  }

  sendJoke(bot, chatId, category = null) {
    let joke;

    if (category) {
      joke = getJokeByCategory(category);
    } else {
      joke = getRandomJoke();
    }

    const jokeId = this.db.addJoke(joke.content, joke.category).lastInsertRowid;
    this.db.incrementJokeUsage(jokeId);
    this.db.recordJokeHistory(jokeId, chatId);

    return bot.sendMessage(chatId, `${EMOJI.LAUGH} ${joke.content}`);
  }

  sendRandomJokeFromDB(bot, chatId) {
    const joke = this.db.getRandomJoke();

    if (!joke) {
      return bot.sendMessage(chatId, `${EMOJI.EYE} В базе пока нет шуток. Добавьте их командой /addjoke`);
    }

    this.db.incrementJokeUsage(joke.id);
    this.db.recordJokeHistory(joke.id, chatId);

    return bot.sendMessage(chatId, `${EMOJI.LAUGH} ${joke.content}`);
  }

  addCustomJoke(content, category = 'general') {
    return this.db.addJoke(content, category);
  }

  getAllJokes() {
    return this.db.getAllJokes();
  }

  getJokeStats() {
    const jokes = this.db.getAllJokes();
    const totalJokes = jokes.length;
    const totalUsage = jokes.reduce((sum, joke) => sum + joke.used_count, 0);

    const categoryStats = {};
    jokes.forEach((joke) => {
      if (!categoryStats[joke.category]) {
        categoryStats[joke.category] = { count: 0, usage: 0 };
      }
      categoryStats[joke.category].count++;
      categoryStats[joke.category].usage += joke.used_count;
    });

    return {
      totalJokes,
      totalUsage,
      categoryStats,
    };
  }

  formatJokesList(jokes) {
    return formatJokesList(jokes);
  }

  formatJokeStats(stats) {
    return formatJokeStats(stats);
  }
}

export default JokeService;
