import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Product } from '../../domain';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { IEventDispatcher } from '../../../../common';
import {
  CreateProductRequest,
  UpdateProductRequest,
  DecreaseStockRequest,
  IncreaseStockRequest,
  ChangePriceRequest,
  ProductResponseDto,
} from '../dto';
import { Money, Quantity } from '../../../../common';

/**
 * Product Application Service
 *
 * This is a THIN service layer that:
 * - Orchestrates domain operations
 * - Handles transaction boundaries
 * - Dispatches domain events
 * - Maps DTOs to/from domain models
 *
 * NO business logic here - all business rules are in the domain entity.
 *
 * Spring Equivalent:
 * @Service
 * @Transactional
 * public class ProductService {
 *     private final ProductRepository repository;
 *     private final EventPublisher eventPublisher;
 * }
 */
@Injectable()
export class ProductApplicationService {
  constructor(
    @Inject('IProductRepository') private readonly repository: IProductRepository,
    @Inject('IEventDispatcher') private readonly eventDispatcher: IEventDispatcher,
  ) {}

  /**
   * Create a new product
   */
  async create(request: CreateProductRequest): Promise<ProductResponseDto> {
    // Convert DTO to Value Objects
    const price = Money.fromWon(request.price);
    const stock = Quantity.of(request.stock);

    // Use domain factory method
    const product = Product.create({
      name: request.name,
      description: request.description,
      price,
      stock,
    });

    // Persist and dispatch events
    await this.saveAndDispatch(product);

    return ProductResponseDto.fromDomain(product);
  }

  /**
   * Find product by ID
   */
  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.requireProduct(id);
    return ProductResponseDto.fromDomain(product);
  }

  /**
   * Find all products
   */
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.repository.findAll();
    return ProductResponseDto.fromDomains(products);
  }

  /**
   * Search products by name
   */
  async searchByName(name: string): Promise<ProductResponseDto[]> {
    const products = await this.repository.findByName(name);
    return ProductResponseDto.fromDomains(products);
  }

  /**
   * Find products with low stock
   */
  async findLowStock(threshold: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.repository.findLowStock(threshold);
    return ProductResponseDto.fromDomains(products);
  }

  /**
   * Update product
   */
  async update(id: number, request: UpdateProductRequest): Promise<ProductResponseDto> {
    const product = await this.requireProduct(id);

    // Update only provided fields using domain methods
    if (request.name !== undefined) {
      product.changeName(request.name);
    }

    if (request.description !== undefined) {
      product.changeDescription(request.description);
    }

    if (request.price !== undefined) {
      product.changePrice(Money.fromWon(request.price));
    }

    if (request.stock !== undefined) {
      const currentStock = product.getStock();
      const newStock = Quantity.of(request.stock);

      if (newStock.isGreaterThan(currentStock)) {
        const diff = newStock.subtract(currentStock);
        product.increaseStock(diff);
      } else if (newStock.isLessThan(currentStock)) {
        const diff = currentStock.subtract(newStock);
        product.decreaseStock(diff);
      }
      // If equal, do nothing
    }

    // Persist and dispatch events
    await this.saveAndDispatch(product);

    return ProductResponseDto.fromDomain(product);
  }

  /**
   * Delete product
   */
  async delete(id: number): Promise<void> {
    const product = await this.requireProduct(id);

    // Mark as deleted (emits event)
    product.markAsDeleted();

    // Dispatch events before deletion
    await this.eventDispatcher.dispatchEvents(product);

    // Delete from repository
    await this.repository.deleteById(id);
  }

  /**
   * Decrease product stock
   */
  async decreaseStock(id: number, request: DecreaseStockRequest): Promise<ProductResponseDto> {
    const product = await this.requireProduct(id);
    product.decreaseStock(Quantity.of(request.quantity));

    await this.saveAndDispatch(product);
    return ProductResponseDto.fromDomain(product);
  }

  /**
   * Increase product stock
   */
  async increaseStock(id: number, request: IncreaseStockRequest): Promise<ProductResponseDto> {
    const product = await this.requireProduct(id);
    product.increaseStock(Quantity.of(request.quantity));

    await this.saveAndDispatch(product);
    return ProductResponseDto.fromDomain(product);
  }

  /**
   * Change product price
   */
  async changePrice(id: number, request: ChangePriceRequest): Promise<ProductResponseDto> {
    const product = await this.requireProduct(id);
    product.changePrice(Money.fromWon(request.price));

    await this.saveAndDispatch(product);
    return ProductResponseDto.fromDomain(product);
  }

  /**
   * Get total product count
   */
  async count(): Promise<number> {
    return await this.repository.count();
  }

  /**
   * Helper: Require product to exist or throw NotFoundException
   */
  private async requireProduct(id: number): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Helper: Save product and dispatch domain events
   * This is a transaction boundary - both save and dispatch should succeed or fail together
   */
  private async saveAndDispatch(product: Product): Promise<void> {
    await this.repository.save(product);
    // Note: Repository implementation handles event dispatching
  }
}
