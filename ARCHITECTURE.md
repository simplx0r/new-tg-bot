# Архитектура проекта

## Обзор

Проект построен на принципах **Clean Architecture** с использованием **Dependency Injection**, **Event-driven** подхода и современными паттернами проектирования.

## Структура слоёв

```
src/
├── core/                      # Ядро приложения
│   └── JokeBotManager.js     # Менеджер жизненного цикла бота
├── domain/                     # Бизнес-логика (Core)
│   ├── entities/               # Сущности домена
│   ├── valueObjects/           # Объекты-значения
│   ├── events/                # Доменные события
│   └── errors/               # Доменные ошибки
├── application/                 # Приложение (Use Cases)
│   └── useCases/              # Сценарии использования
├── infrastructure/              # Инфраструктура
│   ├── telegram/               # Telegram API адаптер
│   ├── di/                    # Dependency Injection
│   ├── repositories/            # Репозитории (Data Access)
│   ├── middleware/             # Middleware для обработки
│   ├── errorHandling/          # Обработка ошибок
│   ├── scheduling/             # Планировщик задач
│   ├── cache/                  # Сервис кэширования
│   ├── monitoring/              # Метрики и мониторинг
│   └── logging/                # Логирование
├── presentation/                # Презентация
│   └── handlers/               # Обработчики событий
├── config/                     # Конфигурация
├── constants/                  # Константы
├── utils/                      # Утилиты
└── data/                       # Данные (jokes)
```

## Принципы Clean Architecture

### 1. Dependency Rule

Зависимости направлены внутрь:

```
Presentation → Application → Domain ← Infrastructure
```

- **Presentation** зависит от **Application**
- **Application** зависит от **Domain**
- **Infrastructure** реализует интерфейсы из **Domain**

### 2. Separation of Concerns

Каждый слой отвечает за свою область:

| Слой | Ответственность |
|--------|----------------|
| **Core** | Координация компонентов, управление жизненным циклом |
| **Domain** | Бизнес-логика, сущности, события |
| **Application** | Use Cases, оркестрация бизнес-логики |
| **Infrastructure** | Внешние зависимости (БД, API, DI, кэш) |
| **Presentation** | Обработка внешних событий (Telegram) |

### 3. Dependency Inversion

Высокоуровневые модули не зависят от низкоуровневых:

```javascript
// Use Case зависит от абстракций (interfaces)
class RecordMessageUseCase {
  constructor(userRepository, statsRepository, eventDispatcher) {
    this.userRepository = userRepository;        // Абстракция
    this.statsRepository = statsRepository;      // Абстракция
    this.eventDispatcher = eventDispatcher;      // Абстракция
  }
}
```

## Ключевые компоненты

### 1. JokeBotManager

**Менеджер жизненного цикла бота** - координирует все компоненты:

- Запускает и останавливает бота
- Настраивает обработчики событий
- Управляет авто-шутками
- Обрабатывает события Telegram
- Собирает и предоставляет статистику

```javascript
const botManager = new JokeBotManager(container);
await botManager.start();
```

### 2. TelegramAdapter

**Абстракция над Telegram API**:

- Инкапсулирует логику работы с `node-telegram-bot-api`
- Обрабатывает ошибки Telegram API
- Позволяет легко мокать в тестах
- Поддерживает миграцию на другие библиотеки

```javascript
class TelegramAdapter extends ITelegramAdapter {
  async sendMessage(chatId, text, options) {
    // Реализация с обработкой ошибок
  }
}
```

### 3. Улучшенный DI контейнер

**Контейнер с жизненными циклами**:

- **Singleton**: Один экземпляр на всё время работы
- **Transient**: Создаётся при каждом запросе
- **Scoped**: Один экземпляр на scope

```javascript
container.registerSingleton('db', () => new Database());
container.registerTransient('userRepository', (c) => new UserRepository(c.get('db')));
```

### 4. Типизированные события

**Система доменных событий** с:

- Типобезопасностью
- Автодополнением в IDE
- Валидацией payload

```javascript
const event = new MessageRecordedEvent({
  user,
  stats,
  chatId,
});

await eventDispatcher.dispatch(event);
```

### 5. ErrorHandler

**Централизованная обработка ошибок**:

- Классификация ошибок по критичности
- Сбор статистики ошибок
- Отправка уведомлений

```javascript
const errorHandler = new ErrorHandler({
  eventDispatcher,
  logToConsole: true,
  dispatchEvents: true,
});

await errorHandler.handle(error, { context: 'some-operation' });
```

### 6. Scheduler

**Планировщик задач** с поддержкой:

- Interval задач
- Timeout задач
- Cron выражений
- Одноразовых задач

```javascript
scheduler.scheduleInterval('task-id', async () => {
  // Выполнение задачи
}, 60000); // Каждые 60 секунд
```

### 7. CacheService

**Сервис кэширования** с:

- TTL (Time To Live)
- LRU eviction
- Статистикой кэша

```javascript
const cache = new CacheService({
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 минут
});

cache.set('key', value, ttl);
const cached = cache.get('key');
```

### 8. MetricsCollector

**Коллектор метрик** для:

- Счётчиков (counters)
- Измерений (gauges)
- Гистограмм (histograms)
- Таймингов (timings)

```javascript
metricsCollector.increment('messages.received');
metricsCollector.timing('message.process', durationMs);
```

## Dependency Injection (DI)

### Container

DI контейнер управляет жизненным циклом зависимостей:

```javascript
// Регистрация сервиса
container.registerSingleton('userRepository', (container) => {
  return new UserRepository(container.get('db'));
});

// Получение сервиса
const userRepo = container.get('userRepository');
```

### Преимущества DI

- **Тестируемость**: Легко мокать зависимости
- **Масштабируемость**: Простое добавление новых сервисов
- **Слабая связанность**: Модули не знают о реализации зависимостей
- **Управление ресурсами**: Автоматическая очистка при остановке

## Event-Driven Architecture

### Event Dispatcher

Централизованный диспетчер событий:

```javascript
eventDispatcher.on('rank.earned', (payload) => {
  // Обработка получения звания
});

eventDispatcher.dispatch({
  name: 'rank.earned',
  payload: { userId, rank, chatId }
});
```

### Типизированные события

| Событие | Класс | Payload |
|----------|--------|---------|
| `message.recorded` | [`MessageRecordedEvent`](src/domain/events/TypedEvent.js) | `{ user, stats, chatId }` |
| `joke.sent` | [`JokeSentEvent`](src/domain/events/TypedEvent.js) | `{ joke, chatId, threadId }` |
| `rank.earned` | [`RankEarnedEvent`](src/domain/events/TypedEvent.js) | `{ userId, rank, chatId, threadId }` |
| `error.occurred` | [`ErrorEvent`](src/domain/events/TypedEvent.js) | `{ error, context, metadata }` |

### Преимущества Events

- **Слабая связанность**: Модули общаются через события
- **Расширяемость**: Легко добавлять новые обработчики
- **Асинхронность**: Обработка событий не блокирует основной поток
- **Типобезопасность**: Автодополнение и валидация

## Repository Pattern

### Абстракция данных

Репозитории скрывают детали реализации БД:

```javascript
class UserRepository {
  async getOrCreate(telegramUser) {
    // Детали реализации скрыты
    const stmt = this.db.statements.get('INSERT_OR_IGNORE');
    // ...
  }
}
```

### Преимущества Repository Pattern

- **Единый интерфейс**: Один способ работы с данными
- **Тестируемость**: Легко заменять на mock
- **Изоляция**: Бизнес-логика не зависит от SQL

## Use Cases

### Сценарии использования

Каждый Use Case решает конкретную бизнес-задачу:

```javascript
class RecordMessageUseCase {
  async execute(telegramUser, chatId) {
    const user = await this.userRepository.getOrCreate(telegramUser);
    const stats = await this.statsRepository.increment(user.id, chatId);

    await this.eventDispatcher.dispatch({
      name: 'message.recorded',
      payload: { user, stats, chatId },
    });

    return { user, stats };
  }
}
```

### Примеры Use Cases

| Use Case | Ответственность |
|-----------|----------------|
| [`RecordMessageUseCase`](src/application/useCases/RecordMessageUseCase.js) | Запись сообщения и обновление статистики |
| [`SendJokeUseCase`](src/application/useCases/SendJokeUseCase.js) | Отправка случайной шутки |
| [`CalculateRankUseCase`](src/application/useCases/CalculateRankUseCase.js) | Расчёт и присвоение звания |

## Flow данных

### Пример: Запись сообщения

```
Telegram Message
    ↓
MessageHandler (Presentation)
    ↓
RecordMessageUseCase (Application)
    ↓
UserRepository + StatsRepository (Infrastructure)
    ↓
Database (Infrastructure)
    ↓
Event: message.recorded (Domain)
    ↓
CalculateRankUseCase (Application)
    ↓
Event: rank.earned (Domain)
    ↓
Telegram Notification (Presentation)
```

## Конфигурация

### Инициализация контейнера

```javascript
export function configureContainer(container, config) {
  // Валидация конфигурации
  const validation = ConfigValidator.validate(config);
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  // Database (singleton)
  container.registerSingleton('db', () => new Database(config.database.path));

  // Event Dispatcher (singleton)
  container.registerInstance('eventDispatcher', new EventDispatcher());

  // Repositories (transient)
  container.registerTransient('userRepository', (c) => new UserRepository(c.get('db')));

  // Use Cases (transient)
  container.registerTransient('recordMessageUseCase', (c) => new RecordMessageUseCase(
    c.get('userRepository'),
    c.get('statsRepository'),
    c.get('eventDispatcher')
  ));

  // Bot Manager (singleton)
  container.registerSingleton('jokeBotManager', (c) => new JokeBotManager(c));
}
```

## Мониторинг и метрики

### Метрики приложения

Система собирает следующие метрики:

- `bot.start` / `bot.stop` - Запуск и остановка бота
- `messages.received` - Полученные сообщения
- `jokes.sent` - Отправленные шутки
- `ranks.earned` - Полученные звания
- `chat.members.new` / `chat.members.left` - Вход/выход участников
- `autojokes.started` / `autojokes.stopped` - Авто-шутки

### Получение метрик

```javascript
const stats = botManager.getStats();
console.log(stats.metrics);
```

## Тестирование

### Unit Tests

Тестируют Use Cases в изоляции:

```javascript
describe('RecordMessageUseCase', () => {
  it('should record message and dispatch event', async () => {
    const mockUserRepo = { getOrCreate: jest.fn() };
    const mockStatsRepo = { increment: jest.fn() };
    const mockEventDispatcher = { dispatch: jest.fn() };

    const useCase = new RecordMessageUseCase(
      mockUserRepo,
      mockStatsRepo,
      mockEventDispatcher
    );

    await useCase.execute({ id: 123 }, 456);

    expect(mockUserRepo.getOrCreate).toHaveBeenCalled();
    expect(mockStatsRepo.increment).toHaveBeenCalled();
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'message.recorded',
        payload: expect.any(Object)
      })
    );
  });
});
```

## Масштабируемость

### Добавление новой функции

1. **Domain**: Создать сущность/событие
2. **Application**: Создать Use Case
3. **Infrastructure**: Создать Repository
4. **Presentation**: Создать Handler
5. **DI**: Зарегистрировать в контейнере

### Пример: Добавление новой команды

```javascript
// 1. Create Use Case (application/useCases/NotifyUseCase.js)
export class NotifyUseCase {
  constructor(notificationRepository, eventDispatcher) {
    this.notificationRepository = notificationRepository;
    this.eventDispatcher = eventDispatcher;
  }

  async execute(chatId, message) {
    await this.notificationRepository.record(chatId, message);
    await this.eventDispatcher.dispatch({
      name: 'notification.sent',
      payload: { chatId, message }
    });
  }
}

// 2. Register in DI (infrastructure/di/config.js)
container.registerTransient('notifyUseCase', (c) => new NotifyUseCase(
  c.get('notificationRepository'),
  c.get('eventDispatcher')
));

// 3. Create Handler (presentation/handlers/NotifyHandler.js)
export class NotifyHandler {
  constructor(notifyUseCase) {
    this.notifyUseCase = notifyUseCase;
  }

  async handle(msg, telegramAdapter) {
    await this.notifyUseCase.execute(msg.chat.id, msg.text);
  }
}
```

## Best Practices

### 1. Single Responsibility Principle

Каждый класс делает одну вещь:
- [`JokeBotManager`](src/core/JokeBotManager.js) — только управление жизненным циклом
- [`UserRepository`](src/infrastructure/repositories/UserRepository.js) — только работа с пользователями
- [`RecordMessageUseCase`](src/application/useCases/RecordMessageUseCase.js) — только запись сообщения
- [`MessageHandler`](src/presentation/handlers/MessageHandler.js) — только обработка Telegram сообщений

### 2. Dependency Inversion

Зависим от абстракций, а не от реализаций:
- Use Cases зависят от Repository interfaces
- Handlers зависят от Use Cases
- [`JokeBotManager`](src/core/JokeBotManager.js) зависит от [`ITelegramAdapter`](src/infrastructure/telegram/ITelegramAdapter.js)

### 3. Open/Closed Principle

Открыт для расширения, закрыт для модификаций:
- Добавление новых событий не требует изменения существующего кода
- Добавление новых Use Cases не требует изменения DI контейнера
- Новые обработчики ошибок через [`ErrorHandler`](src/infrastructure/errorHandling/ErrorHandler.js)

### 4. Interface Segregation

Маленькие, сфокусированные интерфейсы:
- [`ITelegramAdapter`](src/infrastructure/telegram/ITelegramAdapter.js) — только методы для работы с Telegram
- [`EventDispatcher`](src/domain/events/EventDispatcher.js) — только методы для работы с событиями
- [`Container`](src/infrastructure/di/Container.js) — только методы DI

### 5. Don't Repeat Yourself (DRY)

Переиспользование существующего кода:
- Common formatting functions in [`formatters.js`](src/utils/formatters.js)
- Common validation functions in [`validators.js`](src/utils/validators.js)
- Common constants in [`constants/index.js`](src/constants/index.js)

## Заключение

Эта архитектура обеспечивает:

- ✅ **Масштабируемость**: Легко добавлять новые функции
- ✅ **Тестируемость**: Каждый слой тестируется отдельно
- ✅ **Поддерживаемость**: Чёткое разделение ответственности
- ✅ **Гибкость**: Легко менять реализации без изменения бизнес-логики
- ✅ **Надёжность**: Слабая связанность через DI и Events
- ✅ **Мониторинг**: Сбор метрик и статистики
- ✅ **Кэширование**: Оптимизация производительности
- ✅ **Обработка ошибок**: Централизованная и классифицированная
