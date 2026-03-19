import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

/**
 * DTO for decreasing product stock
 */
export class DecreaseStockDto {
  @ApiProperty({ example: 1, description: 'Quantity to decrease' })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  quantity: number;
}
