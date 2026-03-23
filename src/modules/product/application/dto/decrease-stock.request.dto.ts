import { IsNumber, IsPositive } from 'class-validator';

/**
 * Request DTO for decreasing product stock
 *
 * Contains only validation logic.
 */
export class DecreaseStockRequest {
  /**
   * @example 1
   * @description Quantity to decrease
   */
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;
}
