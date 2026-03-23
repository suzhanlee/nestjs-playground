/**
 * Value Object Base Class
 *
 * Value Objects are immutable objects that are identified by their attributes
 * rather than an identity. They are a core concept in Domain-Driven Design.
 *
 * Key characteristics:
 * - Immutable: Once created, they cannot be changed
 * - Equality based on values: Two value objects are equal if all their attributes are equal
 * - No identity: They don't have a unique ID like entities
 *
 * Reference: Martin Fowler - Value Object
 * https://martinfowler.com/bliki/ValueObject.html
 */
export abstract class ValueObject<T> {
  /**
   * The value(s) this value object holds
   */
  protected readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Check if two value objects are equal
   * Value objects are equal if all their attributes are equal
   */
  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (this.constructor !== other.constructor) {
      return false;
    }
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  /**
   * Get the raw value
   */
  getValue(): T {
    return this.value;
  }

  /**
   * Convert to primitive value for easier comparison
   */
  toPrimitive(): T {
    return this.value;
  }
}
