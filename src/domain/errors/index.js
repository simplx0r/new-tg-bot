export { BaseError } from './BaseError.js';

export class ValidationError extends BaseError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource, identifier) {
    super(`${resource} with identifier '${identifier}' not found`, 'NOT_FOUND', 404);
    this.resource = resource;
    this.identifier = identifier;
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

export class DatabaseError extends BaseError {
  constructor(message, details = null) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service, message) {
    super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    this.service = service;
  }
}

export class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
  }
}
