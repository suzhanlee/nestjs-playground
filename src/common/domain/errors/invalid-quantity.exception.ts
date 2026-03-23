import { DomainException } from './domain.exception';

/**
 * Exception thrown when an invalid quantity value is provided
 */
export class InvalidQuantityException extends DomainException {
  constructor(message: string = 'Quantity cannot be negative') {
    super(message, 'INVALID_QUANTITY');
  }
}
