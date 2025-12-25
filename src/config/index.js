import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.ADMIN_CHAT_ID,
  },
  joke: {
    intervalMinutes: Number(process.env.JOKE_INTERVAL_MINUTES || '30'),
  },
  database: {
    path: process.env.DATABASE_PATH || path.join(__dirname, '../../data/bot.db'),
  },
};

export default config;
