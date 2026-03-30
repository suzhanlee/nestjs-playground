import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditLogType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'inventory_id' })
  inventoryId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({
    type: 'enum',
    enum: AuditLogType,
    name: 'type',
  })
  type: AuditLogType;

  @Column({ name: 'quantity', type: 'int' })
  quantity: number;

  @Column({ name: 'previous_quantity', type: 'int' })
  previousQuantity: number;

  @Column({ name: 'new_quantity', type: 'int' })
  newQuantity: number;

  @Column({ name: 'reason', type: 'varchar' })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  private constructor(
    inventoryId: number,
    productId: number,
    type: AuditLogType,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    reason: string,
  ) {
    this.inventoryId = inventoryId;
    this.productId = productId;
    this.type = type;
    this.quantity = quantity;
    this.previousQuantity = previousQuantity;
    this.newQuantity = newQuantity;
    this.reason = reason;
  }

  static createForInbound(
    inventoryId: number,
    productId: number,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    reason: string,
  ): AuditLog {
    return new AuditLog(
      inventoryId,
      productId,
      AuditLogType.INBOUND,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
    );
  }

  static createForOutbound(
    inventoryId: number,
    productId: number,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    reason: string,
  ): AuditLog {
    return new AuditLog(
      inventoryId,
      productId,
      AuditLogType.OUTBOUND,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
    );
  }
}
