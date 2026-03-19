import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Product Entity (similar to JPA @Entity in Spring)
 * Represents the Product aggregate root in DDD
 *
 * Spring JPA Equivalent:
 * @Entity
 * @Table(name = "products")
 */
@Entity('products')
export class Product {
  /**
   * Primary Key (similar to @Id @GeneratedValue in Spring)
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Product name (similar to @Column(nullable = false) in Spring)
   */
  @Column({ nullable: false, length: 255 })
  name: string;

  /**
   * Product description (similar to @Column(length = 1000) in Spring)
   */
  @Column({ length: 1000, nullable: true })
  description: string;

  /**
   * Product price in cents (similar to @Column(nullable = false) in Spring)
   */
  @Column({ type: 'int', nullable: false })
  price: number;

  /**
   * Stock quantity (similar to @Column(nullable = false, defaultValue = 0) in Spring)
   */
  @Column({ type: 'int', nullable: false, default: 0 })
  stock: number;

  /**
   * Creation timestamp (similar to @CreatedDate in Spring)
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Last update timestamp (similar to @LastModifiedDate in Spring)
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Domain logic: Decrease stock
   * @throws Error if stock is insufficient
   */
  decreaseStock(quantity: number): void {
    if (this.stock < quantity) {
      throw new Error(
        `Insufficient stock. Current: ${this.stock}, Requested: ${quantity}`,
      );
    }
    this.stock -= quantity;
  }

  /**
   * Domain logic: Increase stock
   */
  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.stock += quantity;
  }

  /**
   * Domain logic: Update price
   * @throws Error if price is negative
   */
  updatePrice(price: number): void {
    if (price < 0) {
      throw new Error('Price cannot be negative');
    }
    this.price = price;
  }

  /**
   * Domain logic: Check if product is in stock
   */
  isInStock(quantity: number = 1): boolean {
    return this.stock >= quantity;
  }

  /**
   * Domain logic: Get total value
   */
  getTotalValue(): number {
    return this.price * this.stock;
  }
}
