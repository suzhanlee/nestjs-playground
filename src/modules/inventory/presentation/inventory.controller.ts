import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { InventoryService } from '../application/services/inventory.service';
import { InboundRequestDto } from '../application/dto/inbound-request.dto';
import { OutboundRequestDto } from '../application/dto/outbound-request.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.service.findOne(id);
  }

  @Post(':productId/in')
  async processInbound(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: InboundRequestDto,
  ) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    return await this.service.processInbound(productId, dto);
  }

  @Post(':productId/out')
  async processOutbound(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: OutboundRequestDto,
  ) {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    return await this.service.processOutbound(productId, dto);
  }

  @Get(':productId/history')
  async getHistory(@Param('productId', ParseIntPipe) productId: number) {
    return await this.service.getHistory(productId);
  }
}
