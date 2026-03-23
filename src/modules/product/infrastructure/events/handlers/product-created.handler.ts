import { Injectable, Logger } from '@nestjs/common';
import { IDomainEventHandler, ProductCreatedEvent } from '../../../../common';

/**
 * Handler for ProductCreatedEvent
 *
 * This handler is triggered when a new product is created.
 * In a real application, this might:
 * - Send welcome notifications
 * - Update search indexes
 * - Initialize product analytics
 * - Sync with external systems
 */
@Injectable()
export class ProductCreatedHandler implements IDomainEventHandler<ProductCreatedEvent> {
  private readonly logger = new Logger(ProductCreatedHandler.name);

  async handle(event: ProductCreatedEvent): Promise<void> {
    this.logger.log(
      `New product created: "${event.name}" (ID: ${event.aggregateId}) at ₩${(event.price / 100).toLocaleString()} with ${event.stock} items in stock`,
    );

    // TODO: Implement side effects:
    // - Add to search index (Elasticsearch, Algolia, etc.)
    // - Initialize analytics tracking
    // - Sync with e-commerce platforms
    // - Send notifications to relevant teams
  }
}
