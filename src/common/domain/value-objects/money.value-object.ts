import { InvalidMoneyException } from '../errors/invalid-money.exception';

/**
 * Money Value Object
 *
 * Represents a monetary value. Uses cents (or smallest currency unit) internally
 * to avoid floating-point precision issues.
 *
 * Money is a Value Object - it's immutable and compared by value.
 *
 * Examples:
 * - Money.fromWon(10000) creates ₩10,000
 * - Money.create(1000000) creates ₩10,000 (stored as 1,000,000 cents)
 *
 * Reference: Martin Fowler - Money pattern
 * https://martinfowler.com/books/eaa.html
 */
export class Money {
  private readonly amountInCents: number;

  private constructor(amountInCents: number) {
    if (amountInCents < 0) {
      throw new InvalidMoneyException();
    }
    this.amountInCents = amountInCents;
  }

  /**
   * Create Money from cents (smallest currency unit)
   * @param cents - amount in cents
   */
  static create(cents: number): Money {
    return new Money(cents);
  }

  /**
   * Create Money from Won (Korean Won)
   * @param won - amount in Won
   */
  static fromWon(won: number): Money {
    if (won < 0) {
      throw new InvalidMoneyException();
    }
    return new Money(Math.round(won * 100));
  }

  /**
   * Create Money from a decimal amount
   * @param amount - decimal amount (e.g., 100.50 for ₩100.50)
   */
  static fromDecimal(amount: number): Money {
    if (amount < 0) {
      throw new InvalidMoneyException();
    }
    return new Money(Math.round(amount * 100));
  }

  /**
   * Add two Money values
   * @returns A new Money instance with the sum
   */
  add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  /**
   * Subtract other Money from this Money
   * @returns A new Money instance with the difference
   * @throws InvalidMoneyException if result is negative
   */
  subtract(other: Money): Money {
    const result = this.amountInCents - other.amountInCents;
    if (result < 0) {
      throw new InvalidMoneyException('Cannot subtract more than available amount');
    }
    return new Money(result);
  }

  /**
   * Multiply Money by a factor
   * @param factor - multiplication factor
   * @returns A new Money instance with the product
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new InvalidMoneyException('Cannot multiply by negative factor');
    }
    return new Money(Math.round(this.amountInCents * factor));
  }

  /**
   * Divide Money by a divisor
   * @param divisor - division divisor
   * @returns A new Money instance with the quotient
   */
  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new InvalidMoneyException('Divisor must be positive');
    }
    return new Money(Math.round(this.amountInCents / divisor));
  }

  /**
   * Calculate percentage of this Money
   * @param percentage - percentage to calculate (e.g., 10 for 10%)
   */
  percentage(percentage: number): Money {
    if (percentage < 0) {
      throw new InvalidMoneyException('Percentage cannot be negative');
    }
    return new Money(Math.round((this.amountInCents * percentage) / 100));
  }

  /**
   * Check if this Money is greater than other
   */
  isGreaterThan(other: Money): boolean {
    return this.amountInCents > other.amountInCents;
  }

  /**
   * Check if this Money is greater than or equal to other
   */
  isGreaterThanOrEqual(other: Money): boolean {
    return this.amountInCents >= other.amountInCents;
  }

  /**
   * Check if this Money is less than other
   */
  isLessThan(other: Money): boolean {
    return this.amountInCents < other.amountInCents;
  }

  /**
   * Check if this Money is less than or equal to other
   */
  isLessThanOrEqual(other: Money): boolean {
    return this.amountInCents <= other.amountInCents;
  }

  /**
   * Check if this Money is zero
   */
  isZero(): boolean {
    return this.amountInCents === 0;
  }

  /**
   * Check if two Money values are equal
   */
  equals(other: Money): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.amountInCents === other.amountInCents;
  }

  /**
   * Get amount in cents (smallest currency unit)
   */
  toCents(): number {
    return this.amountInCents;
  }

  /**
   * Get amount in Won
   */
  toWon(): number {
    return this.amountInCents / 100;
  }

  /**
   * Get amount as decimal
   */
  toDecimal(): number {
    return this.amountInCents / 100;
  }

  /**
   * Format as currency string (Korean Won)
   */
  toFormat(): string {
    return `₩${this.toWon().toLocaleString('ko-KR')}`;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.toFormat();
  }

  /**
   * JSON serialization
   */
  toJSON(): { cents: number; won: number; formatted: string } {
    return {
      cents: this.amountInCents,
      won: this.toWon(),
      formatted: this.toFormat(),
    };
  }

  /**
   * Create a Money value of zero
   */
  static zero(): Money {
    return new Money(0);
  }
}
