/**
 * Domain Event Interface
 *
 * Domain events represent something that happened in the domain that domain experts care about.
 * They are named in the past tense (e.g., ProductCreated, OrderShipped).
 *
 * Reference: Martin Fowler - Domain Event
 * https://martinfowler.com/eaaDev/DomainEvent.html
 */
export interface IDomainEvent {
  /**
   * The ID of the aggregate that generated this event
   */
  aggregateId: string | number;

  /**
   * When the event occurred
   */
  occurredAt: Date;

  /**
   * Event name/type for identification
   */
  eventName: string;
}
