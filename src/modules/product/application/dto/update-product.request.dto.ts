import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Request DTO for updating a product
 *
 * All fields are optional (PATCH semantics).
 * Only provided fields will be updated.
 */
export class UpdateProductRequest {
  /**
   * @example Updated Product Name
   * @description New product name
   */
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  /**
   * @example Updated description
   * @description New product description
   */
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  /**
   * @example 150000
   * @description New product price in Won
   */
  @IsNumber({}, { message: 'Price must be a number' })
  @IsOptional()
  @Min(0, { message: 'Price cannot be negative' })
  price?: number;

  /**
   * @example 20
   * @description New stock quantity
   */
  @IsNumber({}, { message: 'Stock must be a number' })
  @IsOptional()
  @Min(0, { message: 'Stock cannot be negative' })
  stock?: number;
}
