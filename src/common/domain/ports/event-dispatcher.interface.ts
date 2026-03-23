import { IDomainEvent } from '../events/domain-event.interface';

/**
 * Domain Event Handler Interface
 *
 * Handlers process domain events asynchronously after they are dispatched.
 */
export interface IDomainEventHandler<T extends IDomainEvent> {
  /**
   * Handle the domain event
   * @param event - The domain event to handle
   */
  handle(event: T): Promise<void> | void;

  /**
   * The event class this handler handles
   */
  eventType?: new (...args: unknown[]) => T;
}

/**
 * Domain Event Dispatcher Interface
 *
 * Responsible for dispatching domain events to their registered handlers.
 * This is an infrastructure concern that can be implemented in various ways:
 * - In-memory (simple, synchronous)
 * - Message queue (RabbitMQ, Kafka, etc.)
 * - Event bus (NestJS EventEmitter2, etc.)
 */
export interface IEventDispatcher {
  /**
   * Dispatch a single domain event
   * @param event - The domain event to dispatch
   */
  dispatch(event: IDomainEvent): Promise<void>;

  /**
   * Dispatch multiple domain events
   * @param events - Array of domain events to dispatch
   */
  dispatchBatch(events: IDomainEvent[]): Promise<void>;

  /**
   * Dispatch all domain events from an aggregate and clear them
   * @param aggregate - The aggregate with domain events
   */
  dispatchEvents(aggregate: {
    domainEvents: IDomainEvent[];
    clearDomainEvents(): void;
  }): Promise<void>;

  /**
   * Register a handler for a specific event type
   * @param eventType - The event class
   * @param handler - The handler instance
   */
  register<T extends IDomainEvent>(
    eventType: new (...args: unknown[]) => T,
    handler: IDomainEventHandler<T>,
  ): void;

  /**
   * Unregister a handler for a specific event type
   * @param eventType - The event class
   * @param handler - The handler instance to remove
   */
  unregister<T extends IDomainEvent>(
    eventType: new (...args: unknown[]) => T,
    handler: IDomainEventHandler<T>,
  ): void;

  /**
   * Clear all registered handlers
   */
  clearHandlers(): void;
}
