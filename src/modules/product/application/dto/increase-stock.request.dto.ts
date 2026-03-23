import { IsNumber, IsPositive } from 'class-validator';

/**
 * Request DTO for increasing product stock
 *
 * Contains only validation logic.
 */
export class IncreaseStockRequest {
  /**
   * @example 5
   * @description Quantity to increase
   */
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;
}
