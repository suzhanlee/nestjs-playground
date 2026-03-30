import { Inventory } from '../entities/inventory.entity';
import { AuditLog } from '../entities/audit-log.entity';

export interface IInventoryRepository {
  findById(id: number): Promise<Inventory | null>;
  findByProductId(productId: number): Promise<Inventory | null>;
  findAll(): Promise<Inventory[]>;
  save(inventory: Inventory): Promise<Inventory>;
  createInventory(productId: number, quantity: number): Promise<Inventory>;
  delete(id: number): Promise<void>;
}

export interface IAuditLogRepository {
  save(auditLog: AuditLog): Promise<AuditLog>;
  findByProductId(productId: number, limit?: number): Promise<AuditLog[]>;
  findByInventoryId(inventoryId: number, limit?: number): Promise<AuditLog[]>;
}
