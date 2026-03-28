import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, IsNumber } from 'class-validator';

export class CreateCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
