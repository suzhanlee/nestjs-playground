import { IsInt, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class InboundRequestDto {
  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  reason: string;
}
