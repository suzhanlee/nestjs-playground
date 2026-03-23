import { InvalidQuantityException } from '../errors/invalid-quantity.exception';

/**
 * Quantity Value Object
 *
 * Represents a quantity or count of items. Quantity is always non-negative.
 *
 * Quantity is a Value Object - it's immutable and compared by value.
 *
 * Examples:
 * - Quantity.of(10) creates a quantity of 10
 * - Quantity.of(5).add(Quantity.of(3)) creates a quantity of 8
 */
export class Quantity {
  private readonly value: number;

  private constructor(value: number) {
    if (value < 0 || !Number.isInteger(value)) {
      throw new InvalidQuantityException('Quantity must be a non-negative integer');
    }
    this.value = value;
  }

  /**
   * Create a Quantity from a number
   * @param value - non-negative integer value
   */
  static of(value: number): Quantity {
    return new Quantity(value);
  }

  /**
   * Create a Quantity of zero
   */
  static zero(): Quantity {
    return new Quantity(0);
  }

  /**
   * Create a Quantity of one
   */
  static one(): Quantity {
    return new Quantity(1);
  }

  /**
   * Add two quantities
   * @returns A new Quantity instance with the sum
   */
  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  /**
   * Subtract other quantity from this quantity
   * @returns A new Quantity instance with the difference
   * @throws InvalidQuantityException if result is negative
   */
  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;
    if (result < 0) {
      throw new InvalidQuantityException(`Cannot subtract: result would be negative (${result})`);
    }
    return new Quantity(result);
  }

  /**
   * Multiply quantity by a factor
   * @param factor - multiplication factor (must be positive)
   * @returns A new Quantity instance with the product
   */
  multiply(factor: number): Quantity {
    if (factor < 0) {
      throw new InvalidQuantityException('Cannot multiply by negative factor');
    }
    const result = Math.round(this.value * factor);
    return new Quantity(result);
  }

  /**
   * Divide quantity by a divisor
   * @param divisor - division divisor (must be positive)
   * @returns A new Quantity instance with the quotient (rounded down)
   */
  divide(divisor: number): Quantity {
    if (divisor <= 0) {
      throw new InvalidQuantityException('Divisor must be positive');
    }
    return new Quantity(Math.floor(this.value / divisor));
  }

  /**
   * Increase quantity by a given amount
   * @param amount - amount to increase by (must be positive)
   * @returns A new Quantity instance with increased value
   */
  increase(amount: Quantity): Quantity {
    return this.add(amount);
  }

  /**
   * Decrease quantity by a given amount
   * @param amount - amount to decrease by
   * @returns A new Quantity instance with decreased value
   * @throws InvalidQuantityException if result is negative
   */
  decrease(amount: Quantity): Quantity {
    return this.subtract(amount);
  }

  /**
   * Check if this Quantity is greater than other
   */
  isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  /**
   * Check if this Quantity is greater than or equal to other
   */
  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  /**
   * Check if this Quantity is less than other
   */
  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  /**
   * Check if this Quantity is less than or equal to other
   */
  isLessThanOrEqual(other: Quantity): boolean {
    return this.value <= other.value;
  }

  /**
   * Check if this Quantity is zero
   */
  isZero(): boolean {
    return this.value === 0;
  }

  /**
   * Check if this Quantity is positive (greater than zero)
   */
  isPositive(): boolean {
    return this.value > 0;
  }

  /**
   * Check if two Quantities are equal
   */
  equals(other: Quantity): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Get the numeric value
   */
  toNumber(): number {
    return this.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * JSON serialization
   */
  toJSON(): number {
    return this.value;
  }

  /**
   * Check if this quantity is enough for a required amount
   * @param required - required quantity
   */
  hasEnoughFor(required: Quantity): boolean {
    return this.isGreaterThanOrEqual(required);
  }

  /**
   * Calculate the percentage of this quantity
   * @param percentage - percentage to calculate (0-100)
   */
  percentage(percentage: number): Quantity {
    if (percentage < 0) {
      throw new InvalidQuantityException('Percentage cannot be negative');
    }
    return new Quantity(Math.round((this.value * percentage) / 100));
  }
}
