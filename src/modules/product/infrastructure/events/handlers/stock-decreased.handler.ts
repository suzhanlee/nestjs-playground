import { Injectable, Logger } from '@nestjs/common';
import { IDomainEventHandler, StockDecreasedEvent } from '../../../../common';

/**
 * Handler for StockDecreasedEvent
 *
 * This handler is triggered when product stock is decreased (items sold).
 * In a real application, this might:
 * - Update sales analytics
 * - Trigger reordering if stock is low
 * - Update recommendation algorithms
 */
@Injectable()
export class StockDecreasedHandler implements IDomainEventHandler<StockDecreasedEvent> {
  private readonly logger = new Logger(StockDecreasedHandler.name);

  async handle(event: StockDecreasedEvent): Promise<void> {
    this.logger.log(
      `Stock decreased for "${event.productName}" (ID: ${event.aggregateId}): ` +
        `-${event.quantityDecreased} items (remaining: ${event.remainingStock})`,
    );

    // TODO: Implement side effects:
    // - Update sales analytics/metrics
    // - Update product popularity scores
    // - Trigger automatic reordering if needed
    // - Update inventory reports
  }
}
