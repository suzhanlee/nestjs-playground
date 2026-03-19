import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { DecreaseStockDto } from '../dto/decrease-stock.dto';
import { ProductResponseDto } from '../dto/product-response.dto';

/**
 * Product Service
 * (similar to @Service in Spring)
 *
 * Spring Equivalent:
 * @Service
 * @Transactional
 * public class ProductService {
 *     private final ProductRepository productRepository;
 *
 *     public Product create(CreateProductRequest request) { ... }
 * }
 */
@Injectable()
export class ProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * Create a new product
   * Spring equivalent: public Product create(CreateProductRequest request)
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Create new entity
    const product = new Product();
    product.name = dto.name;
    product.description = dto.description;
    product.price = dto.price;
    product.stock = dto.stock;

    // Save to database
    const savedProduct = await this.productRepository.save(product);

    return ProductResponseDto.fromEntity(savedProduct);
  }

  /**
   * Find all products
   * Spring equivalent: public List<Product> findAll()
   */
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAll();
    return ProductResponseDto.fromEntities(products);
  }

  /**
   * Find product by ID
   * Spring equivalent: public Product findById(Long id)
   */
  async findById(id: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return ProductResponseDto.fromEntity(product);
  }

  /**
   * Search products by name
   */
  async searchByName(name: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findByName(name);
    return ProductResponseDto.fromEntities(products);
  }

  /**
   * Find products with low stock
   */
  async findLowStock(threshold: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findLowStock(threshold);
    return ProductResponseDto.fromEntities(products);
  }

  /**
   * Update product
   * Spring equivalent: public Product update(Long id, UpdateProductRequest request)
   */
  async update(id: number, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Update only provided fields
    if (dto.name !== undefined) {
      product.name = dto.name;
    }
    if (dto.description !== undefined) {
      product.description = dto.description;
    }
    if (dto.price !== undefined) {
      product.updatePrice(dto.price);
    }
    if (dto.stock !== undefined) {
      product.stock = dto.stock;
    }

    const updatedProduct = await this.productRepository.save(product);

    return ProductResponseDto.fromEntity(updatedProduct);
  }

  /**
   * Delete product
   * Spring equivalent: public void delete(Long id)
   */
  async delete(id: number): Promise<void> {
    const exists = await this.productRepository.existsById(id);

    if (!exists) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productRepository.deleteById(id);
  }

  /**
   * Decrease product stock
   * Use case: When an order is placed
   */
  async decreaseStock(id: number, dto: DecreaseStockDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    try {
      product.decreaseStock(dto.quantity);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const updatedProduct = await this.productRepository.save(product);

    return ProductResponseDto.fromEntity(updatedProduct);
  }

  /**
   * Increase product stock
   * Use case: When stock is replenished
   */
  async increaseStock(id: number, quantity: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    try {
      product.increaseStock(quantity);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const updatedProduct = await this.productRepository.save(product);

    return ProductResponseDto.fromEntity(updatedProduct);
  }

  /**
   * Get total product count
   */
  async count(): Promise<number> {
    return await this.productRepository.count();
  }
}
