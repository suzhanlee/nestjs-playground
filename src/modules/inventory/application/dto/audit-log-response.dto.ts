import { AuditLog } from '../../domain/entities/audit-log.entity';

export class AuditLogResponseDto {
  id: number;
  inventoryId: number;
  productId: number;
  type: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  createdAt: Date;

  static fromEntity(entity: AuditLog): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = entity.id;
    dto.inventoryId = entity.inventoryId;
    dto.productId = entity.productId;
    dto.type = entity.type;
    dto.quantity = entity.quantity;
    dto.previousQuantity = entity.previousQuantity;
    dto.newQuantity = entity.newQuantity;
    dto.reason = entity.reason;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
