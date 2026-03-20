import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * DTO for creating a new product
 * (similar to @RequestBody in Spring)
 *
 * Spring Equivalent:
 * public class CreateProductRequest {
 *     @NotBlank
 *     private String name;
 *
 *     @Min(0)
 *     private Integer price;
 *
 *     @Min(0)
 *     private Integer stock;
 * }
 */
export class CreateProductDto {
  @ApiProperty({ example: 'Laptop', description: 'Product name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    example: 'High-performance laptop',
    description: 'Product description',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({ example: 99999, description: 'Product price in cents' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({ example: 10, description: 'Stock quantity' })
  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock cannot be negative' })
  stock: number;
}
