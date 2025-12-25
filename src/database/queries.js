export const USER_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  INSERT_OR_IGNORE: `
    INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name)
    VALUES (?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE users
    SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `,

  SELECT_BY_TELEGRAM_ID: 'SELECT * FROM users WHERE telegram_id = ?',

  SELECT_BY_ID: 'SELECT * FROM users WHERE id = ?',
};

export const MESSAGE_STATS_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS message_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chat_id INTEGER NOT NULL,
      message_count INTEGER DEFAULT 0,
      last_message_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, chat_id)
    )
  `,

  INCREMENT: `
    INSERT INTO message_stats (user_id, chat_id, message_count, last_message_at)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, chat_id) DO UPDATE SET
      message_count = message_count + 1,
      last_message_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `,

  SELECT_USER_STATS: `
    SELECT
      u.*,
      ms.message_count,
      ms.last_message_at,
      r.name as rank_name,
      r.category as rank_category
    FROM users u
    LEFT JOIN message_stats ms ON u.id = ms.user_id AND ms.chat_id = ?
    LEFT JOIN user_ranks ur ON u.id = ur.user_id
    LEFT JOIN ranks r ON ur.rank_id = r.id
    WHERE u.id = ?
  `,

  SELECT_TOP_USERS: `
    SELECT
      u.*,
      ms.message_count,
      ms.last_message_at,
      r.name as rank_name,
      r.category as rank_category
    FROM users u
    INNER JOIN message_stats ms ON u.id = ms.user_id
    LEFT JOIN user_ranks ur ON u.id = ur.user_id
    LEFT JOIN ranks r ON ur.rank_id = r.id
    WHERE ms.chat_id = ?
    ORDER BY ms.message_count DESC
    LIMIT ?
  `,

  SELECT_ALL_CHAT_STATS: `
    SELECT
      u.*,
      ms.message_count,
      ms.last_message_at,
      r.name as rank_name,
      r.category as rank_category
    FROM users u
    INNER JOIN message_stats ms ON u.id = ms.user_id
    LEFT JOIN user_ranks ur ON u.id = ur.user_id
    LEFT JOIN ranks r ON ur.rank_id = r.id
    WHERE ms.chat_id = ?
    ORDER BY ms.message_count DESC
  `,

  SELECT_CHAT_SUMMARY: `
    SELECT
      COUNT(*) as total_users,
      SUM(ms.message_count) as total_messages,
      MAX(ms.message_count) as max_messages
    FROM users u
    INNER JOIN message_stats ms ON u.id = ms.user_id
    WHERE ms.chat_id = ?
  `,
};

export const JOKE_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS jokes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_count INTEGER DEFAULT 0
    )
  `,

  INSERT: `
    INSERT INTO jokes (content, category)
    VALUES (?, ?)
  `,

  SELECT_RANDOM: `
    SELECT * FROM jokes
    ORDER BY RANDOM()
    LIMIT 1
  `,

  SELECT_BY_ID: 'SELECT * FROM jokes WHERE id = ?',

  SELECT_ALL: 'SELECT * FROM jokes ORDER BY used_count DESC',

  UPDATE_USAGE: `
    UPDATE jokes
    SET used_count = used_count + 1
    WHERE id = ?
  `,

  SELECT_STATS: `
    SELECT
      category,
      COUNT(*) as count,
      SUM(used_count) as usage
    FROM jokes
    GROUP BY category
  `,
};

export const JOKE_HISTORY_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS joke_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      joke_id INTEGER NOT NULL,
      chat_id INTEGER NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (joke_id) REFERENCES jokes(id) ON DELETE CASCADE
    )
  `,

  INSERT: `
    INSERT INTO joke_history (joke_id, chat_id)
    VALUES (?, ?)
  `,

  SELECT_BY_CHAT: `
    SELECT * FROM joke_history
    WHERE chat_id = ?
    ORDER BY sent_at DESC
    LIMIT ?
  `,
};

export const CHAT_SETTINGS_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS chat_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER UNIQUE NOT NULL,
      jokes_enabled INTEGER DEFAULT 1,
      jokes_interval INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  CHAT_SETTINGS_INSERT: `
    INSERT INTO chat_settings (chat_id)
    VALUES (?)
  `,

  SELECT_BY_CHAT_ID: 'SELECT * FROM chat_settings WHERE chat_id = ?',

  CHAT_SETTINGS_UPDATE: `
    UPDATE chat_settings
    SET jokes_enabled = COALESCE(?, jokes_enabled),
        jokes_interval = COALESCE(?, jokes_interval),
        updated_at = CURRENT_TIMESTAMP
    WHERE chat_id = ?
  `,
};

export const ADMIN_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      added_by INTEGER
    )
  `,

  INSERT_OR_IGNORE: `
    INSERT OR IGNORE INTO admins (telegram_id, added_by)
    VALUES (?, ?)
  `,

  DELETE: 'DELETE FROM admins WHERE telegram_id = ?',

  SELECT_ALL: 'SELECT * FROM admins',

  SELECT_BY_TELEGRAM_ID: 'SELECT * FROM admins WHERE telegram_id = ?',
};

export const RANK_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS ranks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      min_messages INTEGER NOT NULL,
      description TEXT,
      emoji TEXT
    )
  `,

  INSERT: `
    INSERT INTO ranks (name, category, min_messages, description, emoji)
    VALUES (?, ?, ?, ?, ?)
  `,

  SELECT_ALL: 'SELECT * FROM ranks ORDER BY min_messages ASC',

  SELECT_BY_CATEGORY: 'SELECT * FROM ranks WHERE category = ? ORDER BY min_messages ASC',

  SELECT_BY_ID: 'SELECT * FROM ranks WHERE id = ?',
};

export const USER_RANK_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS user_ranks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      rank_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE CASCADE,
      UNIQUE(user_id, rank_id)
    )
  `,

  INSERT_OR_REPLACE: `
    INSERT OR REPLACE INTO user_ranks (user_id, rank_id, earned_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `,

  SELECT_BY_USER: `
    SELECT r.*
    FROM ranks r
    INNER JOIN user_ranks ur ON r.id = ur.rank_id
    WHERE ur.user_id = ?
    ORDER BY r.min_messages DESC
    LIMIT 1
  `,

  DELETE_BY_USER: 'DELETE FROM user_ranks WHERE user_id = ?',
};

export const REACTION_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_text TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      reaction_content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  INSERT: `
    INSERT INTO reactions (trigger_text, reaction_type, reaction_content, category)
    VALUES (?, ?, ?, ?)
  `,

  SELECT_ALL: 'SELECT * FROM reactions',

  SELECT_BY_CATEGORY: 'SELECT * FROM reactions WHERE category = ?',

  SELECT_RANDOM: `
    SELECT * FROM reactions
    ORDER BY RANDOM()
    LIMIT 1
  `,
};

export const NOTIFICATION_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      sent_by INTEGER NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  INSERT: `
    INSERT INTO notifications (chat_id, message, sent_by)
    VALUES (?, ?, ?)
  `,

  SELECT_BY_CHAT: `
    SELECT * FROM notifications
    WHERE chat_id = ?
    ORDER BY sent_at DESC
    LIMIT ?
  `,
};
