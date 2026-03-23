import { DomainException } from './domain.exception';

/**
 * Exception thrown when a price change violates business rules
 */
export class InvalidPriceChangeException extends DomainException {
  constructor(message: string = 'Price change exceeds allowed limit') {
    super(message, 'INVALID_PRICE_CHANGE');
  }
}
