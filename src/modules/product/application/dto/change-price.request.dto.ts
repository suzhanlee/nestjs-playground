import { IsNumber, Min } from 'class-validator';

/**
 * Request DTO for changing product price
 *
 * Contains only validation logic.
 * Business rule (max 50% increase) is enforced in domain.
 */
export class ChangePriceRequest {
  /**
   * @example 150000
   * @description New price in Won
   */
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;
}
