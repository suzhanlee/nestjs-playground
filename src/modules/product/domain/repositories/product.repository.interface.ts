import { Product } from '../product.entity';

/**
 * Product Repository Interface (similar to Spring Data Repository)
 * Defines the contract for product data operations
 *
 * Spring Equivalent:
 * public interface ProductRepository extends JpaRepository<Product, Long> {
 *     Optional<Product> findByName(String name);
 *     List<Product> findByStockLessThan(Integer stock);
 * }
 */
export interface IProductRepository {
  /**
   * Find product by ID
   * Spring: Optional<Product> findById(Long id);
   */
  findById(id: number): Promise<Product | null>;

  /**
   * Find all products
   * Spring: List<Product> findAll();
   */
  findAll(): Promise<Product[]>;

  /**
   * Find products by name (partial match)
   * Spring: List<Product> findByNameContaining(String name);
   */
  findByName(name: string): Promise<Product[]>;

  /**
   * Find products with low stock
   * Spring: List<Product> findByStockLessThan(Integer stock);
   */
  findLowStock(threshold: number): Promise<Product[]>;

  /**
   * Save or update product
   * Spring: Product save(Product product);
   */
  save(product: Product): Promise<Product>;

  /**
   * Delete product by ID
   * Spring: void deleteById(Long id);
   */
  deleteById(id: number): Promise<boolean>;

  /**
   * Check if product exists
   * Spring: boolean existsById(Long id);
   */
  existsById(id: number): Promise<boolean>;

  /**
   * Count total products
   * Spring: long count();
   */
  count(): Promise<number>;
}
