import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IInventoryRepository,
  IAuditLogRepository,
} from '../../domain/repositories/inventory.repository.interface';
import { Inventory } from '../../domain/entities/inventory.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(
    @InjectRepository(Inventory)
    private readonly repository: Repository<Inventory>,
  ) {}

  async findById(id: number): Promise<Inventory | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByProductId(productId: number): Promise<Inventory | null> {
    return await this.repository.findOne({ where: { productId } });
  }

  async findAll(): Promise<Inventory[]> {
    return await this.repository.find();
  }

  async save(inventory: Inventory): Promise<Inventory> {
    return await this.repository.save(inventory);
  }

  async createInventory(productId: number, quantity: number): Promise<Inventory> {
    const inventory = Inventory.create(productId, quantity);
    return await this.repository.save(inventory);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async save(auditLog: AuditLog): Promise<AuditLog> {
    return await this.repository.save(auditLog);
  }

  async findByProductId(productId: number, limit: number = 100): Promise<AuditLog[]> {
    return await this.repository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByInventoryId(inventoryId: number, limit: number = 100): Promise<AuditLog[]> {
    return await this.repository.find({
      where: { inventoryId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
