export class Container {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  register(name, factory) {
    this.factories.set(name, factory);
  }

  registerInstance(name, instance) {
    this.services.set(name, instance);
  }

  get(name) {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory(this);
      this.services.set(name, instance);
      return instance;
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  clear() {
    this.services.clear();
    this.factories.clear();
  }
}
