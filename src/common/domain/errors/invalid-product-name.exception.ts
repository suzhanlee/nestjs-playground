import { DomainException } from './domain.exception';

/**
 * Exception thrown when a product name is invalid
 */
export class InvalidProductNameException extends DomainException {
  constructor(message: string = 'Product name is invalid') {
    super(message, 'INVALID_PRODUCT_NAME');
  }
}
