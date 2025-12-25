export class Event {
  constructor(name, payload, timestamp = new Date()) {
    this.name = name;
    this.payload = payload;
    this.timestamp = timestamp;
    this.id = this.generateId();
  }

  generateId() {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
