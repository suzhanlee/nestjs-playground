import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import {
  IDomainEvent,
  InvalidCategoryNameException,
  CategoryDepthExceededException,
  CategoryCircularReferenceException,
  CategoryCreatedEvent,
  CategoryNameChangedEvent,
  CategoryParentChangedEvent,
  CategoryActivatedEvent,
  CategoryDeactivatedEvent,
  CategoryDeletedEvent,
} from '../../../common';

/**
 * Category Entity - Rich Domain Model
 *
 * This is the Category aggregate root in DDD. It encapsulates all business logic
 * related to a category.
 *
 * Key characteristics:
 * - Private properties (encapsulation)
 * - Factory method for creation
 * - Business methods that maintain invariants
 * - Domain events for side effects
 * - Self-referential hierarchy (parent-child)
 */
@Entity('categories')
export class Category {
  // ========================================
  // Private Properties (TypeORM columns)
  // ========================================

  /**
   * Primary Key
   */
  @PrimaryGeneratedColumn()
  private _id: number;

  /**
   * Category name (must be unique)
   * Max length: 100 characters
   */
  private _name: string;

  /**
   * Parent category ID (null for root categories)
   * Uses ID reference pattern (not direct entity reference)
   */
  @Column({ name: 'parent_id', nullable: true })
  private _parentId: number | null;

  /**
   * Category level (0 = root, 1 = child, 2 = grandchild)
   * Max allowed: 2 (supports 3 levels total)
   */
  @Column({ name: 'level', default: 0 })
  private _level: number;

  /**
   * Active status flag
   * Inactive categories are hidden but not deleted
   */
  @Column({ name: 'is_active', default: true })
  private _isActive: boolean;

  /**
   * Products in this category (not persisted, loaded by TypeORM relation)
   */
  private _products: any[] = [];

  /**
   * Child categories (not persisted, loaded by TypeORM relation)
   */
  private _children: Category[] = [];

  /**
   * Domain events collection (not persisted)
   */
  private _domainEvents: IDomainEvent[] = [];

  // ========================================
  // TypeORM Relations
  // ========================================

  /**
   * Parent category (self-referential many-to-one)
   * Only used for TypeORM loading, not in domain logic
   */
  @ManyToOne(() => Category, { nullable: true, onDelete: 'CASCADE' })
  parent?: Category;

  /**
   * Child categories (self-referential one-to-many)
   * Only used for TypeORM loading, not in domain logic
   */
  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  // ========================================
  // TypeORM Decorators (on getters)
  // ========================================

  @Column({ nullable: false, length: 100, unique: true })
  get name(): string {
    return this._name;
  }

  @Column({ name: 'parent_id', nullable: true })
  get parentId(): number | null {
    return this._parentId;
  }
  set parentId(value: number | null) {
    this._parentId = value;
  }

  @Column({ name: 'level', default: 0 })
  get level(): number {
    return this._level;
  }
  set level(value: number) {
    this._level = value;
  }

  @Column({ name: 'is_active', default: true })
  get isActive(): boolean {
    return this._isActive;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ========================================
  // TypeORM Accessor
  // ========================================

  @Column()
  get id(): number {
    return this._id;
  }
  set id(value: number) {
    this._id = value;
  }

  // ========================================
  // Factory Method
  // ========================================

  /**
   * Factory method to create a new Category
   *
   * @param data - Category creation data
   * @throws InvalidCategoryNameException if name is invalid
   * @throws CategoryDepthExceededException if depth would exceed 3 levels
   */
  static create(data: {
    name: string;
    parentId: number | null;
    parentLevel?: number;
    isActive?: boolean;
  }): Category {
    const { name, parentId, parentLevel = 0, isActive = true } = data;

    // Validate name
    if (!name || typeof name !== 'string') {
      throw new InvalidCategoryNameException('Category name is required');
    }
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      throw new InvalidCategoryNameException('Category name must be between 1 and 100 characters');
    }

    // Calculate new level
    const newLevel = parentId === null ? 0 : parentLevel + 1;

    // Validate depth (max 3 levels: 0, 1, 2)
    if (newLevel > 2) {
      throw new CategoryDepthExceededException('Maximum category depth of 3 levels exceeded');
    }

    // Create category instance
    const category = new Category();
    category._name = trimmedName;
    category._parentId = parentId;
    category._level = newLevel;
    category._isActive = isActive;

    // Emit domain event
    category.addEvent(new CategoryCreatedEvent(0, trimmedName, parentId, newLevel));

    return category;
  }

  // ========================================
  // Business Methods - Name
  // ========================================

  /**
   * Change the category name
   *
   * @param newName - The new name
   * @throws InvalidCategoryNameException if name is invalid
   */
  changeName(newName: string): void {
    if (!newName || typeof newName !== 'string') {
      throw new InvalidCategoryNameException('Category name is required');
    }
    const trimmedName = newName.trim();
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      throw new InvalidCategoryNameException('Category name must be between 1 and 100 characters');
    }

    const oldName = this._name;
    this._name = trimmedName;

    // Emit domain event
    this.addEvent(new CategoryNameChangedEvent(this._id, oldName, this._name));
  }

  // ========================================
  // Business Methods - Parent (Hierarchy)
  // ========================================

  /**
   * Change the parent category (move to different location in hierarchy)
   *
   * @param newParentId - The new parent category ID
   * @param newParentLevel - The level of the new parent
   * @throws CategoryDepthExceededException if new depth would exceed 3 levels
   * @throws CategoryCircularReferenceException if circular reference detected
   */
  changeParent(newParentId: number | null, newParentLevel: number): void {
    // Check for circular reference (can't be parent of yourself)
    if (newParentId === this._id) {
      throw new CategoryCircularReferenceException('Category cannot be its own parent');
    }

    const oldParentId = this._parentId;
    const oldLevel = this._level;
    const newLevel = newParentId === null ? 0 : newParentLevel + 1;

    // Validate depth
    if (newLevel > 2) {
      throw new CategoryDepthExceededException('Maximum category depth of 3 levels exceeded');
    }

    this._parentId = newParentId;
    this._level = newLevel;

    // Emit domain event
    this.addEvent(
      new CategoryParentChangedEvent(this._id, oldParentId, newParentId, oldLevel, newLevel),
    );
  }

  // ========================================
  // Business Methods - Activation
  // ========================================

  /**
   * Activate this category
   */
  activate(): void {
    if (!this._isActive) {
      this._isActive = true;
      this.addEvent(new CategoryActivatedEvent(this._id, this._name));
    }
  }

  /**
   * Deactivate this category
   */
  deactivate(): void {
    if (this._isActive) {
      this._isActive = false;
      this.addEvent(new CategoryDeactivatedEvent(this._id, this._name));
    }
  }

  // ========================================
  // Business Methods - Queries
  // ========================================

  /**
   * Check if this category has products
   */
  hasProducts(): boolean {
    return this._products.length > 0;
  }

  /**
   * Set products (used by repository/application service)
   */
  setProducts(products: any[]): void {
    this._products = products;
  }

  /**
   * Check if this category has child categories
   */
  hasChildren(): boolean {
    return this._children.length > 0;
  }

  /**
   * Set children (used by repository/application service)
   */
  setChildren(children: Category[]): void {
    this._children = children;
  }

  /**
   * Get the level of this category (0 = root, 1 = child, 2 = grandchild)
   */
  getLevel(): number {
    return this._level;
  }

  /**
   * Check if this category can be deleted
   * A category can be deleted if:
   * - It has no products
   * - It has no children
   * - It is not the last category in the system
   *
   * @param totalCategoryCount - Total number of categories in the system
   */
  canDelete(totalCategoryCount: number): boolean {
    if (this.hasProducts()) {
      return false;
    }
    if (this.hasChildren()) {
      return false;
    }
    if (totalCategoryCount <= 1) {
      return false;
    }
    return true;
  }

  // ========================================
  // Domain Events Management
  // ========================================

  /**
   * Get all pending domain events
   * Returns a copy to prevent external modification
   */
  get domainEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear all domain events after they've been dispatched
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Add a domain event
   * Private method - only called by business methods within the entity
   */
  private addEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  // ========================================
  // Lifecycle Methods
  // ========================================

  /**
   * Mark this category as deleted
   * This emits a CategoryDeletedEvent
   *
   * Note: Actual deletion is handled by the repository
   */
  markAsDeleted(): void {
    this.addEvent(new CategoryDeletedEvent(this._id, this._name, this._parentId));
  }
}
