import { IDomainEvent } from './domain-event.interface';

/**
 * Base class for Domain Events
 *
 * Provides common functionality for all domain events.
 * Extending this class ensures all events have consistent structure.
 */
export abstract class DomainEventBase implements IDomainEvent {
  /**
   * The ID of the aggregate that generated this event
   */
  readonly aggregateId: string | number;

  /**
   * When the event occurred
   */
  readonly occurredAt: Date;

  /**
   * Event name/type for identification
   */
  readonly eventName: string;

  constructor(aggregateId: string | number, occurredAt: Date = new Date()) {
    this.aggregateId = aggregateId;
    this.occurredAt = occurredAt;
    this.eventName = this.constructor.name;
  }

  /**
   * Convert event to a simple object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      occurredAt: this.occurredAt.toISOString(),
      ...this.getEventPayload(),
    };
  }

  /**
   * Override this method to provide event-specific payload
   */
  protected getEventPayload(): Record<string, unknown> {
    return {};
  }
}
