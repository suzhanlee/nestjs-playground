import { Injectable, Logger } from '@nestjs/common';
import { IDomainEventHandler, StockLowEvent } from '../../../../common';

/**
 * Handler for StockLowEvent
 *
 * This handler is triggered when product stock falls below a threshold.
 * In a real application, this might:
 * - Send email notifications
 * - Create purchase orders
 * - Update inventory dashboards
 * - Send alerts to managers
 *
 * This is infrastructure code - it depends on external systems.
 */
@Injectable()
export class StockLowHandler implements IDomainEventHandler<StockLowEvent> {
  private readonly logger = new Logger(StockLowHandler.name);

  async handle(event: StockLowEvent): Promise<void> {
    this.logger.warn(
      `LOW STOCK ALERT: Product "${event.productName}" (ID: ${event.aggregateId}) has only ${event.currentStock} items left (threshold: ${event.threshold})`,
    );

    // TODO: Implement actual business notifications:
    // - Send email to purchasing department
    // - Create automatic purchase order
    // - Update inventory dashboard
    // - Send Slack/webhook notification
  }
}
