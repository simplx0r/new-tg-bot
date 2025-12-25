export class EventDispatcher {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(listener);
  }

  off(eventName, listener) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(listener);
    }
  }

  async dispatch(event) {
    const { name, payload } = event;

    if (this.listeners.has(name)) {
      const listeners = this.listeners.get(name);
      const promises = Array.from(listeners).map(listener =>
        Promise.resolve(listener(payload, event))
      );

      await Promise.allSettled(promises);
    }
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}
