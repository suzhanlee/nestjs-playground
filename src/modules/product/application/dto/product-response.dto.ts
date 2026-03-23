import { Product } from '../../domain';
import { Money, Quantity } from '../../../../common';

/**
 * Response DTO for product operations
 *
 * This is a pure data transfer object - no business logic here.
 * It maps from the rich domain model to a simple response format.
 *
 * Spring Equivalent:
 * public class ProductResponse {
 *     private Long id;
 *     private String name;
 *     ...
 * }
 */
export class ProductResponseDto {
  id: number;
  name: string;
  description: string | null;
  price: number; // in Won (not cents)
  stock: number;
  priceFormatted: string;
  totalValue: number;
  totalValueFormatted: string;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Factory method to create DTO from domain entity
   * This is the ONLY way to create a response DTO
   */
  static fromDomain(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description;

    const price = product.getPrice();
    dto.price = price.toWon();
    dto.priceFormatted = price.toFormat();

    const stock = product.getStock();
    dto.stock = stock.toNumber();

    const totalValue = product.getTotalValue();
    dto.totalValue = totalValue.toWon();
    dto.totalValueFormatted = totalValue.toFormat();

    dto.isInStock = product.isInStock();
    dto.isLowStock = product.isLowStock();
    dto.isOutOfStock = product.isOutOfStock();

    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }

  /**
   * Factory method to create DTOs from multiple entities
   */
  static fromDomains(products: Product[]): ProductResponseDto[] {
    return products.map((product) => this.fromDomain(product));
  }
}
