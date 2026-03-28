import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryRequestDto } from './create-category.request.dto';

export class UpdateCategoryRequestDto extends PartialType(CreateCategoryRequestDto) {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
