/**
 * Улучшенный DI контейнер с поддержкой жизненных циклов
 * Поддерживает три типа сервисов: Singleton, Transient, Scoped
 */
export class Container {
  constructor() {
    this.singletons = new Map(); // Экземпляры singleton
    this.factories = new Map(); // Фабрики для создания сервисов
    this.scopes = new Map(); // Scoped сервисы по scopeId
    this.metadata = new Map(); // Метаданные сервисов
  }

  /**
   * Зарегистрировать сервис как Singleton
   * @param {string} name - Имя сервиса
   * @param {Function} factory - Фабрика для создания сервиса
   * @param {Object} options - Дополнительные опции
   * @returns {Container} this для цепочного вызова
   */
  registerSingleton(name, factory, options = {}) {
    this._register(name, factory, 'singleton', options);
    return this;
  }

  /**
   * Зарегистрировать сервис как Transient (создаётся каждый раз)
   * @param {string} name - Имя сервиса
   * @param {Function} factory - Фабрика для создания сервиса
   * @param {Object} options - Дополнительные опции
   * @returns {Container} this для цепочного вызова
   */
  registerTransient(name, factory, options = {}) {
    this._register(name, factory, 'transient', options);
    return this;
  }

  /**
   * Зарегистрировать сервис как Scoped (один экземпляр на scope)
   * @param {string} name - Имя сервиса
   * @param {Function} factory - Фабрика для создания сервиса
   * @param {Object} options - Дополнительные опции
   * @returns {Container} this для цепочного вызова
   */
  registerScoped(name, factory, options = {}) {
    this._register(name, factory, 'scoped', options);
    return this;
  }

  /**
   * Зарегистрировать готовый экземпляр (всегда singleton)
   * @param {string} name - Имя сервиса
   * @param {*} instance - Экземпляр сервиса
   * @param {Object} options - Дополнительные опции
   * @returns {Container} this для цепочного вызова
   */
  registerInstance(name, instance, options = {}) {
    this.singletons.set(name, instance);
    this.metadata.set(name, {
      type: 'singleton',
      instance: true,
      ...options,
    });
    return this;
  }

  /**
   * Получить сервис из контейнера
   * @param {string} name - Имя сервиса
   * @param {string} scopeId - ID scope для scoped сервисов
   * @returns {*} Экземпляр сервиса
   */
  get(name, scopeId = 'default') {
    // Проверяем singleton
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Проверяем scoped
    if (this.scopes.has(scopeId) && this.scopes.get(scopeId).has(name)) {
      return this.scopes.get(scopeId).get(name);
    }

    // Проверяем фабрику
    if (this.factories.has(name)) {
      const { factory, type, options } = this.factories.get(name);
      const instance = factory(this);

      // Если singleton - сохраняем
      if (type === 'singleton') {
        this.singletons.set(name, instance);
      }
      // Если scoped - сохраняем в scope
      else if (type === 'scoped') {
        if (!this.scopes.has(scopeId)) {
          this.scopes.set(scopeId, new Map());
        }
        this.scopes.get(scopeId).set(name, instance);
      }

      // Вызываем метод инициализации, если есть
      if (options?.initMethod && typeof instance[options.initMethod] === 'function') {
        instance[options.initMethod]();
      }

      return instance;
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  /**
   * Проверить, существует ли сервис
   * @param {string} name - Имя сервиса
   * @returns {boolean} Существует ли сервис
   */
  has(name) {
    return this.singletons.has(name)
      || this.factories.has(name)
      || Array.from(this.scopes.values()).some((scope) => scope.has(name));
  }

  /**
   * Создать новый scope
   * @param {string} scopeId - ID scope
   * @returns {Container} this для цепочного вызова
   */
  createScope(scopeId) {
    if (!this.scopes.has(scopeId)) {
      this.scopes.set(scopeId, new Map());
    }
    return this;
  }

  /**
   * Удалить scope и очистить все scoped сервисы
   * @param {string} scopeId - ID scope
   * @returns {Container} this для цепочного вызова
   */
  destroyScope(scopeId) {
    const scope = this.scopes.get(scopeId);
    if (scope) {
      // Вызываем методы очистки для всех сервисов в scope
      scope.forEach((instance, name) => {
        const metadata = this.metadata.get(name);
        if (metadata?.disposeMethod && typeof instance[metadata.disposeMethod] === 'function') {
          instance[metadata.disposeMethod]();
        }
      });
      scope.clear();
      this.scopes.delete(scopeId);
    }
    return this;
  }

  /**
   * Очистить все сервисы и контейнер
   */
  clear() {
    // Вызываем методы очистки для всех singletons
    this.singletons.forEach((instance, name) => {
      const metadata = this.metadata.get(name);
      if (metadata?.disposeMethod && typeof instance[metadata.disposeMethod] === 'function') {
        instance[metadata.disposeMethod]();
      }
    });

    // Очищаем все scopes
    this.scopes.forEach((scope, scopeId) => {
      this.destroyScope(scopeId);
    });

    this.singletons.clear();
    this.factories.clear();
    this.metadata.clear();
  }

  /**
   * Получить метаданные сервиса
   * @param {string} name - Имя сервиса
   * @returns {Object|null} Метаданные или null
   */
  getMetadata(name) {
    return this.metadata.get(name) || null;
  }

  /**
   * Получить все зарегистрированные сервисы
   * @returns {Array<string>} Список имён сервисов
   */
  getRegisteredServices() {
    const services = new Set([
      ...this.singletons.keys(),
      ...this.factories.keys(),
    ]);
    return Array.from(services);
  }

  /**
   * Внутренний метод регистрации сервиса
   * @private
   * @param {string} name - Имя сервиса
   * @param {Function} factory - Фабрика
   * @param {string} type - Тип сервиса
   * @param {Object} options - Опции
   */
  _register(name, factory, type, options) {
    if (this.singletons.has(name) || this.factories.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }

    this.factories.set(name, {
      factory,
      type,
      options,
    });

    this.metadata.set(name, {
      type,
      ...options,
    });
  }
}

export default Container;
