import { Product } from '../../domain/entities/product.entity';

/**
 * Response DTO for product operations
 * (similar to ResponseEntity/DTO in Spring)
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
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.description = product.description ?? null;
    dto.price = product.price;
    dto.stock = product.stock;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }

  static fromEntities(products: Product[]): ProductResponseDto[] {
    return products.map((product) => this.fromEntity(product));
  }
}
