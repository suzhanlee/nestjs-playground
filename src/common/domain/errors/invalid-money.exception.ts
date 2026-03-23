import { DomainException } from './domain.exception';

/**
 * Exception thrown when an invalid money value is provided
 */
export class InvalidMoneyException extends DomainException {
  constructor(message: string = 'Money amount cannot be negative') {
    super(message, 'INVALID_MONEY');
  }
}
