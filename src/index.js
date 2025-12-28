import config from './config/index.js';
import { JokeBotManager } from './core/JokeBotManager.js';
import { Container } from './infrastructure/di/Container.js';
import { configureContainer } from './infrastructure/di/config.js';

/**
 * Точка входа приложения
 * Создаёт DI контейнер, настраивает зависимости и запускает бота
 */
async function main() {
  try {
    // Создаём DI контейнер
    const container = new Container();

    // Настраиваем зависимости
    configureContainer(container, config);
    console.log('✅ DI контейнер настроен');

    // Получаем менеджер бота из контейнера
    const botManager = container.get('jokeBotManager');

    // Запускаем бота
    await botManager.start();

    // Обработка сигналов завершения
    setupShutdownHandlers(botManager);
  } catch (error) {
    console.error('❌ Ошибка при запуске бота:', error);
    process.exit(1);
  }
}

/**
 * Настроить обработчики сигналов завершения
 * @param {JokeBotManager} botManager - Менеджер бота
 */
function setupShutdownHandlers(botManager) {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Получен сигнал ${signal}...`);
    try {
      await botManager.stop();
      process.exit(0);
    } catch (error) {
      console.error('❌ Ошибка при остановке бота:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Обработка необработанных ошибок
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });
}

// Запускаем приложение
main();
