import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  IInventoryRepository,
  IAuditLogRepository,
} from '../../domain/repositories/inventory.repository.interface';
import {
  InventoryRepository,
  AuditLogRepository,
} from '../../infrastructure/repositories/inventory.repository.impl';
import { Inventory } from '../../domain/entities/inventory.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { InboundRequestDto } from '../dto/inbound-request.dto';
import { OutboundRequestDto } from '../dto/outbound-request.dto';
import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly auditLogRepo: IAuditLogRepository,
  ) {}

  async findAll(): Promise<InventoryResponseDto[]> {
    const inventories = await this.inventoryRepo.findAll();
    return inventories.map(InventoryResponseDto.fromEntity);
  }

  async findOne(id: number): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepo.findById(id);
    if (!inventory) {
      throw new NotFoundException(`Inventory with id ${id} not found`);
    }
    return InventoryResponseDto.fromEntity(inventory);
  }

  async findByProductId(productId: number): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepo.findByProductId(productId);
    if (!inventory) {
      throw new NotFoundException(`Inventory for product ${productId} not found`);
    }
    return InventoryResponseDto.fromEntity(inventory);
  }

  async processInbound(productId: number, dto: InboundRequestDto): Promise<InventoryResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      let inventory = await this.inventoryRepo.findByProductId(productId);

      if (!inventory) {
        inventory = await this.inventoryRepo.createInventory(productId, 0);
      }

      const previousQuantity = inventory.quantity;
      inventory.increase(dto.quantity, dto.reason);
      const savedInventory = await this.inventoryRepo.save(inventory);

      const auditLog = AuditLog.createForInbound(
        savedInventory.id,
        productId,
        dto.quantity,
        previousQuantity,
        savedInventory.quantity,
        dto.reason,
      );

      await this.auditLogRepo.save(auditLog);

      await queryRunner.commitTransaction();

      return InventoryResponseDto.fromEntity(savedInventory);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async processOutbound(productId: number, dto: OutboundRequestDto): Promise<InventoryResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventory = await this.inventoryRepo.findByProductId(productId);

      if (!inventory) {
        throw new NotFoundException(`Inventory for product ${productId} not found`);
      }

      const previousQuantity = inventory.quantity;
      inventory.decrease(dto.quantity, dto.reason);
      const savedInventory = await this.inventoryRepo.save(inventory);

      const auditLog = AuditLog.createForOutbound(
        savedInventory.id,
        productId,
        dto.quantity,
        previousQuantity,
        savedInventory.quantity,
        dto.reason,
      );

      await this.auditLogRepo.save(auditLog);

      await queryRunner.commitTransaction();

      return InventoryResponseDto.fromEntity(savedInventory);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.name === 'InsufficientStockException') {
        throw new ConflictException(error.message);
      }

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistory(productId: number): Promise<AuditLogResponseDto[]> {
    const auditLogs = await this.auditLogRepo.findByProductId(productId);
    return auditLogs.map(AuditLogResponseDto.fromEntity);
  }
}
