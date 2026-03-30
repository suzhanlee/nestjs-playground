import { Inventory } from '../../domain/entities/inventory.entity';

export class InventoryResponseDto {
  id: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: Inventory): InventoryResponseDto {
    const dto = new InventoryResponseDto();
    dto.id = entity.id;
    dto.productId = entity.productId;
    dto.quantity = entity.quantity;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
