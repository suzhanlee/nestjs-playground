import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Request DTO for creating a new product
 *
 * This contains ONLY validation logic. Business rules are enforced
 * by the domain entity's factory method.
 *
 * Spring Equivalent:
 * public class CreateProductRequest {
 *     @NotBlank
 *     private String name;
 *     ...
 * }
 */
export class CreateProductRequest {
  /**
   * @example Laptop
   * @description Product name
   */
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  /**
   * @example High-performance laptop
   * @description Product description
   */
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  /**
   * @example 99999
   * @description Product price in Won
   */
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  /**
   * @example 10
   * @description Stock quantity
   */
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;
}
