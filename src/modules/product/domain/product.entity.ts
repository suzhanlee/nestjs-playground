import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  Money,
  Quantity,
  IDomainEvent,
  InvalidMoneyException,
  InvalidQuantityException,
  InvalidProductNameException,
  InsufficientStockException,
  InvalidPriceChangeException,
  ProductCreatedEvent,
  ProductPriceChangedEvent,
  StockDecreasedEvent,
  StockIncreasedEvent,
  StockLowEvent,
  ProductNameChangedEvent,
  ProductDescriptionChangedEvent,
  ProductDeletedEvent,
} from '../../../common';

/**
 * Product Entity - Rich Domain Model
 *
 * This is the Product aggregate root in DDD. It encapsulates all business logic
 * related to a product. External code cannot directly modify its state -
 * they must use the provided business methods.
 *
 * Key characteristics:
 * - Private properties (encapsulation)
 * - Factory method for creation
 * - Business methods that maintain invariants
 * - Domain events for side effects
 * - Uses Value Objects (Money, Quantity)
 *
 * Reference: Martin Fowler - Domain Model
 * https://martinfowler.com/eaaDev/domainModel.html
 */
@Entity('products')
export class Product {
  // ========================================
  // Private Properties (TypeORM columns)
  // ========================================

  /**
   * Primary Key
   * TypeORM needs access to this, so we use a getter
   */
  @PrimaryGeneratedColumn()
  private _id: number;

  /**
   * Product name
   * @Column decorator needed on the getter for TypeORM
   */
  private _name: string;

  /**
   * Product description (optional)
   */
  private _description: string | null;

  /**
   * Product price stored in cents
   * Internally stored as number for TypeORM, exposed as Money value object
   */
  @Column({ type: 'int', nullable: false })
  private _priceInCents: number;

  /**
   * Stock quantity
   * Internally stored as number for TypeORM, exposed as Quantity value object
   */
  private _stock: number;

  /**
   * Domain events collection (not persisted)
   * Events are collected during state changes and dispatched after persistence
   */
  private _domainEvents: IDomainEvent[] = [];

  // ========================================
  // TypeORM Decorators (on getters)
  // ========================================

  @Column({ nullable: false, length: 255 })
  get name(): string {
    return this._name;
  }

  @Column({ length: 1000, nullable: true })
  get description(): string | null {
    return this._description;
  }

  @Column({ type: 'int', nullable: false, default: 0 })
  get stock(): number {
    return this._stock;
  }
  set stock(value: number) {
    this._stock = value;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ========================================
  // TypeORM Accessor
  // ========================================

  /**
   * TypeORM needs to access the id property
   * This getter allows TypeORM to read/write the id
   */
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
   * Factory method to create a new Product
   *
   * This is the ONLY way to create a Product from outside the domain.
   * It validates all inputs and emits a ProductCreatedEvent.
   *
   * @param data - Product creation data
   * @throws InvalidProductNameException if name is invalid
   * @throws InvalidMoneyException if price is invalid
   * @throws InvalidQuantityException if stock is invalid
   */
  static create(data: {
    name: string;
    description?: string;
    price: Money;
    stock: Quantity;
  }): Product {
    // Validate name
    if (!data.name || data.name.trim().length === 0 || data.name.length > 255) {
      throw new InvalidProductNameException('Name must be between 1 and 255 characters');
    }

    // Create product instance
    const product = new Product();
    product._name = data.name.trim();
    product._description = data.description?.trim() || null;
    product._priceInCents = data.price.toCents();
    product._stock = data.stock.toNumber();

    // Emit domain event
    product.addEvent(
      new ProductCreatedEvent(
        0, // ID not assigned yet
        product._name,
        product._priceInCents,
        product._stock,
        product._description,
      ),
    );

    return product;
  }

  // ========================================
  // Business Methods - Price
  // ========================================

  /**
   * Change the price of this product
   *
   * Business rule: Price cannot increase by more than 50% at once
   * to prevent price gouging.
   *
   * @param newPrice - The new price
   * @throws InvalidPriceChangeException if price change exceeds 50% increase
   */
  changePrice(newPrice: Money): void {
    const currentPrice = Money.create(this._priceInCents);

    // Business rule: cannot increase by more than 50%
    if (newPrice.isGreaterThan(currentPrice.multiply(1.5))) {
      throw new InvalidPriceChangeException('Price cannot increase by more than 50% at once');
    }

    const oldPrice = this._priceInCents;
    this._priceInCents = newPrice.toCents();

    // Emit domain event
    this.addEvent(new ProductPriceChangedEvent(this._id, oldPrice, this._priceInCents, this._name));
  }

  /**
   * Get the current price as a Money value object
   */
  getPrice(): Money {
    return Money.create(this._priceInCents);
  }

  // ========================================
  // Business Methods - Stock
  // ========================================

  /**
   * Decrease stock by a given quantity
   *
   * This is used when items are sold or removed from inventory.
   * Emits StockDecreasedEvent and possibly StockLowEvent.
   *
   * @param quantity - The quantity to decrease
   * @throws InsufficientStockException if not enough stock available
   */
  decreaseStock(quantity: Quantity): void {
    const currentStock = Quantity.of(this._stock);

    if (currentStock.isLessThan(quantity)) {
      throw new InsufficientStockException(this._stock, quantity.toNumber());
    }

    const newStock = currentStock.decrease(quantity);
    this._stock = newStock.toNumber();

    // Emit domain event
    this.addEvent(new StockDecreasedEvent(this._id, this._name, quantity.toNumber(), this._stock));

    // Emit low stock alert if below threshold
    const LOW_STOCK_THRESHOLD = 10;
    if (newStock.toNumber() > 0 && newStock.isLessThan(Quantity.of(LOW_STOCK_THRESHOLD))) {
      this.addEvent(new StockLowEvent(this._id, this._name, this._stock, LOW_STOCK_THRESHOLD));
    }
  }

  /**
   * Increase stock by a given quantity
   *
   * This is used when items are added to inventory (restocking, returns, etc.)
   *
   * @param quantity - The quantity to increase
   * @throws InvalidQuantityException if quantity is invalid
   */
  increaseStock(quantity: Quantity): void {
    const currentStock = Quantity.of(this._stock);
    const newStock = currentStock.increase(quantity);
    this._stock = newStock.toNumber();

    // Emit domain event
    this.addEvent(new StockIncreasedEvent(this._id, this._name, quantity.toNumber(), this._stock));
  }

  /**
   * Get the current stock as a Quantity value object
   */
  getStock(): Quantity {
    return Quantity.of(this._stock);
  }

  /**
   * Check if there's enough stock for a given quantity
   * @param quantity - The quantity to check
   */
  hasStockFor(quantity: Quantity): boolean {
    return this.getStock().isGreaterThanOrEqual(quantity);
  }

  // ========================================
  // Business Methods - Name
  // ========================================

  /**
   * Change the product name
   *
   * @param newName - The new name
   * @throws InvalidProductNameException if name is invalid
   */
  changeName(newName: string): void {
    if (!newName || newName.trim().length === 0 || newName.length > 255) {
      throw new InvalidProductNameException('Name must be between 1 and 255 characters');
    }

    const oldName = this._name;
    this._name = newName.trim();

    // Emit domain event
    this.addEvent(new ProductNameChangedEvent(this._id, oldName, this._name));
  }

  // ========================================
  // Business Methods - Description
  // ========================================

  /**
   * Change the product description
   *
   * @param newDescription - The new description (null to clear)
   */
  changeDescription(newDescription: string | null): void {
    const oldDescription = this._description;
    this._description = newDescription?.trim() || null;

    // Emit domain event
    this.addEvent(
      new ProductDescriptionChangedEvent(this._id, this._name, oldDescription, this._description),
    );
  }

  // ========================================
  // Business Methods - Queries
  // ========================================

  /**
   * Check if this product is in stock
   * @param quantity - Optional quantity to check (defaults to 1)
   */
  isInStock(quantity: number = 1): boolean {
    return this._stock >= quantity;
  }

  /**
   * Check if stock is low (below threshold)
   * @param threshold - The low stock threshold (default 10)
   */
  isLowStock(threshold: number = 10): boolean {
    return this._stock > 0 && this._stock < threshold;
  }

  /**
   * Check if this product is out of stock
   */
  isOutOfStock(): boolean {
    return this._stock === 0;
  }

  /**
   * Get the total value of this product (price × stock)
   * @returns Total value as Money
   */
  getTotalValue(): Money {
    return Money.create(this._priceInCents).multiply(this._stock);
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
   * Mark this product as deleted
   * This emits a ProductDeletedEvent
   *
   * Note: Actual deletion is handled by the repository
   */
  markAsDeleted(): void {
    this.addEvent(new ProductDeletedEvent(this._id, this._name));
  }
}
