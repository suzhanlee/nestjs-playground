import { Category } from '../../domain';

export class CategoryResponseDto {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  isActive: boolean;
  hasProducts: boolean;
  hasChildren: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(entity: Category, totalCategoryCount?: number): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.parentId = entity.parentId;
    dto.level = entity.level;
    dto.isActive = entity.isActive;
    dto.hasProducts = entity.hasProducts();
    dto.hasChildren = entity.hasChildren();
    dto.canDelete = totalCategoryCount !== undefined ? entity.canDelete(totalCategoryCount) : false;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromDomains(entities: Category[], totalCategoryCount?: number): CategoryResponseDto[] {
    return entities.map((entity) => CategoryResponseDto.fromDomain(entity, totalCategoryCount));
  }
}
