import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class InsufficientStockException extends Error {
  constructor(currentStock: number, requested: number) {
    super(`Insufficient stock: current=${currentStock}, requested=${requested}`);
    this.name = 'InsufficientStockException';
  }
}

export class InvalidQuantityException extends Error {
  constructor(quantity: number) {
    super(`Invalid quantity: ${quantity}. Quantity must be positive.`);
    this.name = 'InvalidQuantityException';
  }
}

@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', unique: true })
  productId: number;

  @Column({ name: 'quantity', type: 'int', default: 0 })
  private _quantity: number;

  get quantity(): number {
    return this._quantity;
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ name: 'version' })
  version: number;

  private constructor(productId: number, quantity: number) {
    this.productId = productId;
    this._quantity = quantity;
  }

  static create(productId: number, quantity: number): Inventory {
    if (quantity < 0) {
      throw new InvalidQuantityException(quantity);
    }
    const inventory = new Inventory(productId, quantity);
    return inventory;
  }

  increase(amount: number, reason: string): void {
    if (amount <= 0) {
      throw new InvalidQuantityException(amount);
    }
    this._quantity += amount;
  }

  decrease(amount: number, reason: string): void {
    if (amount <= 0) {
      throw new InvalidQuantityException(amount);
    }
    if (this._quantity < amount) {
      throw new InsufficientStockException(this._quantity, amount);
    }
    this._quantity -= amount;
  }

  canDecrease(amount: number): boolean {
    return this._quantity >= amount;
  }
}
