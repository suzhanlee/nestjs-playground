import { Category } from '../category.entity';

/**
 * Category Repository Interface (similar to Spring Data Repository)
 * Defines the contract for category data operations
 *
 * Spring Equivalent:
 * public interface CategoryRepository extends JpaRepository<Category, Long> {
 *     Optional<Category> findByName(String name);
 *     List<Category> findByParentIdIsNull();
 *     List<Category> findByParentId(Long parentId);
 *     boolean existsByName(String name);
 * }
 */
export interface ICategoryRepository {
  /**
   * Find category by ID
   * Spring: Optional<Category> findById(Long id);
   */
  findById(id: number): Promise<Category | null>;

  /**
   * Find all categories
   * Spring: List<Category> findAll();
   */
  findAll(): Promise<Category[]>;

  /**
   * Find category by name (exact match, case-sensitive)
   * Spring: Optional<Category> findByName(String name);
   */
  findByName(name: string): Promise<Category | null>;

  /**
   * Find categories by parent ID
   * Spring: List<Category> findByParentId(Long parentId);
   */
  findByParentId(parentId: number | null): Promise<Category[]>;

  /**
   * Find root categories (parentId is null)
   * Spring: List<Category> findByParentIdIsNull();
   */
  findRootCategories(): Promise<Category[]>;

  /**
   * Find children of a category
   * Spring: List<Category> findByParentId(Long parentId);
   */
  findChildren(parentId: number): Promise<Category[]>;

  /**
   * Find categories by active status
   * Spring: List<Category> findByIsActive(boolean isActive);
   */
  findByIsActive(isActive: boolean): Promise<Category[]>;

  /**
   * Check if category exists by ID
   * Spring: boolean existsById(Long id);
   */
  existsById(id: number): Promise<boolean>;

  /**
   * Check if category exists by name
   * Spring: boolean existsByName(String name);
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Count total categories
   * Spring: long count();
   */
  count(): Promise<number>;

  /**
   * Save or update category
   * Spring: Category save(Category category);
   */
  save(category: Category): Promise<Category>;

  /**
   * Delete category by ID
   * Spring: void deleteById(Long id);
   */
  deleteById(id: number): Promise<boolean>;

  /**
   * Find category with children (for hierarchy operations)
   * Returns category with children array populated
   */
  findByIdWithChildren(id: number): Promise<Category | null>;

  /**
   * Find category with products
   * Returns category with products array populated
   */
  findByIdWithProducts(id: number): Promise<Category | null>;

  /**
   * Find all categories in tree structure
   * Returns all categories with parent-child relationships
   */
  findTree(): Promise<Category[]>;

  /**
   * Get the level of a category by traversing parents
   * Used for validation when creating children
   */
  getLevel(id: number): Promise<number>;

  /**
   * Check if a category is a descendant of another
   * Used to prevent circular references
   */
  isDescendant(categoryId: number, ancestorId: number): Promise<boolean>;

  /**
   * Find all descendants of a category (recursively)
   */
  findDescendants(categoryId: number): Promise<Category[]>;

  /**
   * Find products in a category (and optionally in descendants)
   */
  findProducts(categoryId: number, includeDescendants?: boolean): Promise<any[]>;
}
