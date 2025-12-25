# Архитектура проекта

## Обзор

Проект построен на принципах **Clean Architecture** с использованием **Dependency Injection** и **Event-driven** подхода.

## Структура слоёв

```
src/
├── domain/                 # Бизнес-логика (Core)
│   ├── entities/           # Сущности домена
│   ├── valueObjects/       # Объекты-значения
│   └── events/            # Доменные события
├── application/            # Приложение (Use Cases)
│   └── useCases/          # Сценарии использования
├── infrastructure/          # Инфраструктура
│   ├── repositories/        # Репозитории (Data Access)
│   ├── di/                # Dependency Injection
│   └── database/           # База данных
├── presentation/           # Презентация
│   └── handlers/          # Обработчики событий
├── config/                # Конфигурация
├── constants/             # Константы
├── utils/                 # Утилиты
└── data/                  # Данные (jokes)
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
| **Domain** | Бизнес-логика, сущности, события |
| **Application** | Use Cases, оркестрация бизнес-логики |
| **Infrastructure** | Внешние зависимости (БД, API, DI) |
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

## Dependency Injection (DI)

### Container

DI контейнер управляет жизненным циклом зависимостей:

```javascript
// Регистрация сервиса
container.register('userRepository', (container) => {
  return new UserRepository(container.get('db'));
});

// Получение сервиса
const userRepo = container.get('userRepository');
```

### Преимущества DI

- **Тестируемость**: Легко мокать зависимости
- **Масштабируемость**: Простое добавление новых сервисов
- **Слабая связанность**: Модули не знают о реализации зависимостей

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

### Преимущества Events

- **Слабая связанность**: Модули общаются через события
- **Расширяемость**: Легко добавлять новые обработчики
- **Асинхронность**: Обработка событий не блокирует основной поток

### Доменные события

| Событие | Описание | Payload |
|----------|-------------|----------|
| `message.recorded` | Сообщение записано | `{ user, stats, chatId }` |
| `joke.sent` | Шутка отправлена | `{ joke, chatId }` |
| `rank.earned` | Звание получено | `{ userId, rank, chatId }` |

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
| `RecordMessageUseCase` | Запись сообщения и обновление статистики |
| `SendJokeUseCase` | Отправка случайной шутки |
| `CalculateRankUseCase` | Расчёт и присвоение звания |

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
  // Database
  container.register('db', () => new Database(config.database.path));

  // Event Dispatcher (singleton)
  container.registerInstance('eventDispatcher', new EventDispatcher());

  // Repositories
  container.register('userRepository', (container) => {
    return new UserRepository(container.get('db'));
  });

  // Use Cases
  container.register('recordMessageUseCase', (container) => {
    return new RecordMessageUseCase(
      container.get('userRepository'),
      container.get('statsRepository'),
      container.get('eventDispatcher')
    );
  });
}
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
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith({
      name: 'message.recorded',
      payload: expect.any(Object)
    });
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
container.register('notifyUseCase', (container) => {
  return new NotifyUseCase(
    container.get('notificationRepository'),
    container.get('eventDispatcher')
  );
});

// 3. Create Handler (presentation/handlers/NotifyHandler.js)
export class NotifyHandler {
  constructor(notifyUseCase) {
    this.notifyUseCase = notifyUseCase;
  }

  async handle(msg, bot) {
    await this.notifyUseCase.execute(msg.chat.id, msg.text);
  }
}
```

## Best Practices

### 1. Single Responsibility Principle

Каждый класс делает одну вещь:
- `UserRepository` — только работа с пользователями
- `RecordMessageUseCase` — только запись сообщения
- `MessageHandler` — только обработка Telegram сообщений

### 2. Dependency Inversion

Зависим от абстракций, а не от реализаций:
- Use Cases зависят от Repository interfaces
- Handlers зависят от Use Cases

### 3. Open/Closed Principle

Открыт для расширения, закрыт для модификаций:
- Добавление новых событий не требует изменения существующего кода
- Добавление новых Use Cases не требует изменения DI контейнера

### 4. Interface Segregation

Маленькие, сфокусированные интерфейсы:
- `UserRepository` — только методы для работы с пользователями
- `StatsRepository` — только методы для статистики

### 5. Don't Repeat Yourself (DRY)

Переиспользование существующего кода:
- Common formatting functions in `utils/formatters.js`
- Common validation functions in `utils/validators.js`
- Common constants in `constants/index.js`

## Заключение

Эта архитектура обеспечивает:

- ✅ **Масштабируемость**: Легко добавлять новые функции
- ✅ **Тестируемость**: Каждый слой тестируется отдельно
- ✅ **Поддерживаемость**: Чёткое разделение ответственности
- ✅ **Гибкость**: Легко менять реализации без изменения бизнес-логики
- ✅ **Надёжность**: Слабая связанность через DI и Events
