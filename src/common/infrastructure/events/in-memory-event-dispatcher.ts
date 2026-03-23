import { IEventDispatcher, IDomainEventHandler } from '../../domain/ports/event-dispatcher.interface';
import { IDomainEvent } from '../../domain/events/domain-event.interface';

/**
 * In-memory implementation of the Event Dispatcher
 *
 * This is a simple synchronous implementation suitable for development and testing.
 * In production, you might want to use a message queue or async event bus.
 *
 * Reference: Martin Fowler - Domain Events
 * https://martinfowler.com/eaaDev/DomainEvent.html
 */
export class InMemoryEventDispatcher implements IEventDispatcher {
  private handlers: Map<string, IDomainEventHandler<IDomainEvent>[]> = new Map();

  async dispatch(event: IDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName);

    if (!handlers || handlers.length === 0) {
      // No handlers registered for this event type
      return;
    }

    // Execute all handlers for this event type
    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        // Log error but continue with other handlers
        console.error(`Error handling event ${event.eventName}:`, error);
        // In production, you might want to implement retry logic or dead letter queue
      }
    }
  }

  async dispatchBatch(events: IDomainEvent[]): Promise<void> {
    // Process events in sequence (can be parallelized if needed)
    for (const event of events) {
      await this.dispatch(event);
    }
  }

  async dispatchEvents(aggregate: {
    domainEvents: IDomainEvent[];
    clearDomainEvents: () => void;
  }): Promise<void> {
    const events = aggregate.domainEvents;

    if (events.length === 0) {
      return;
    }

    // Dispatch all events
    await this.dispatchBatch(events);

    // Clear events from aggregate after successful dispatch
    aggregate.clearDomainEvents();
  }

  register<T extends IDomainEvent>(
    eventType: new (...args: unknown[]) => T,
    handler: IDomainEventHandler<T>,
  ): void {
    const eventName = eventType.name;

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    const handlers = this.handlers.get(eventName)!;
    handlers.push(handler as IDomainEventHandler<IDomainEvent>);
  }

  unregister<T extends IDomainEvent>(
    eventType: new (...args: unknown[]) => T,
    handler: IDomainEventHandler<T>,
  ): void {
    const eventName = eventType.name;
    const handlers = this.handlers.get(eventName);

    if (!handlers) {
      return;
    }

    const index = handlers.indexOf(handler as IDomainEventHandler<IDomainEvent>);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    // Clean up empty handler arrays
    if (handlers.length === 0) {
      this.handlers.delete(eventName);
    }
  }

  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of registered handlers for an event type
   * Useful for testing
   */
  getHandlerCount(eventType: new (...args: unknown[]) => IDomainEvent): number {
    const handlers = this.handlers.get(eventType.name);
    return handlers ? handlers.length : 0;
  }

  /**
   * Check if a handler is registered for an event type
   * Useful for testing
   */
  hasHandler(eventType: new (...args: unknown[]) => IDomainEvent): boolean {
    const handlers = this.handlers.get(eventType.name);
    return handlers ? handlers.length > 0 : false;
  }
}
