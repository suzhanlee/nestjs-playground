import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryController } from './presentation/inventory.controller';
import { InventoryService } from './application/services/inventory.service';
import { Inventory } from './domain/entities/inventory.entity';
import { AuditLog } from './domain/entities/audit-log.entity';
import {
  InventoryRepository,
  AuditLogRepository,
} from './infrastructure/repositories/inventory.repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, AuditLog])],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryRepository,
    AuditLogRepository,
    {
      provide: 'IInventoryRepository',
      useExisting: InventoryRepository,
    },
    {
      provide: 'IAuditLogRepository',
      useExisting: AuditLogRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {
  constructor(private readonly dataSource: DataSource) {}
}
