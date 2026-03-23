import { DomainException } from './domain.exception';

/**
 * Exception thrown when trying to decrease stock below zero
 */
export class InsufficientStockException extends DomainException {
  constructor(
    public readonly currentStock: number,
    public readonly requested: number,
  ) {
    super(
      `Insufficient stock. Current: ${currentStock}, Requested: ${requested}`,
      'INSUFFICIENT_STOCK',
    );
  }
}
