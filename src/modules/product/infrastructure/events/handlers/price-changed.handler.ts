import { Injectable, Logger } from '@nestjs/common';
import { IDomainEventHandler, ProductPriceChangedEvent } from '../../../../common';

/**
 * Handler for ProductPriceChangedEvent
 *
 * This handler is triggered when a product's price is changed.
 * In a real application, this might:
 * - Update price history
 * - Notify customers who have wishlisted
 * - Update catalog feeds
 * - Audit price changes
 */
@Injectable()
export class PriceChangedHandler implements IDomainEventHandler<ProductPriceChangedEvent> {
  private readonly logger = new Logger(PriceChangedHandler.name);

  async handle(event: ProductPriceChangedEvent): Promise<void> {
    const priceDiff = (event.newPrice - event.oldPrice) / 100;
    const percentageChange = ((event.newPrice - event.oldPrice) / event.oldPrice) * 100;

    this.logger.log(
      `Price changed for "${event.productName}" (ID: ${event.aggregateId}): ` +
        `₩${(event.oldPrice / 100).toLocaleString()} → ₩${(event.newPrice / 100).toLocaleString()} ` +
        `(${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%)`,
    );

    // TODO: Implement side effects:
    // - Record price change history in database
    // - Notify customers with this product in wishlist
    // - Update product catalog feeds (Google Shopping, etc.)
    // - Audit significant price changes
  }
}
