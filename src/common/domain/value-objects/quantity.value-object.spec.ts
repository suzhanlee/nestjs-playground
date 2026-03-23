import { Quantity } from './quantity.value-object';
import { InvalidQuantityException } from '../errors/invalid-quantity.exception';

describe('Quantity Value Object', () => {
  describe('Creation', () => {
    it('should create Quantity from number', () => {
      const quantity = Quantity.of(10);
      expect(quantity.toNumber()).toBe(10);
    });

    it('should create Quantity of zero', () => {
      const quantity = Quantity.zero();
      expect(quantity.toNumber()).toBe(0);
      expect(quantity.isZero()).toBe(true);
    });

    it('should create Quantity of one', () => {
      const quantity = Quantity.one();
      expect(quantity.toNumber()).toBe(1);
    });

    it('should throw InvalidQuantityException for negative value', () => {
      expect(() => Quantity.of(-1)).toThrow(InvalidQuantityException);
    });

    it('should throw InvalidQuantityException for non-integer value', () => {
      expect(() => Quantity.of(1.5)).toThrow(InvalidQuantityException);
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add two Quantities', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(5);
      const result = q1.add(q2);
      expect(result.toNumber()).toBe(15);
    });

    it('should subtract Quantity from Quantity', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(3);
      const result = q1.subtract(q2);
      expect(result.toNumber()).toBe(7);
    });

    it('should throw when subtracting more than available', () => {
      const q1 = Quantity.of(5);
      const q2 = Quantity.of(10);
      expect(() => q1.subtract(q2)).toThrow(InvalidQuantityException);
    });

    it('should multiply Quantity by factor', () => {
      const q = Quantity.of(10);
      const result = q.multiply(2);
      expect(result.toNumber()).toBe(20);
    });

    it('should multiply by decimal factor and round', () => {
      const q = Quantity.of(10);
      const result = q.multiply(1.5);
      expect(result.toNumber()).toBe(15);
    });

    it('should throw when multiplying by negative factor', () => {
      const q = Quantity.of(10);
      expect(() => q.multiply(-1)).toThrow(InvalidQuantityException);
    });

    it('should divide Quantity by divisor', () => {
      const q = Quantity.of(10);
      const result = q.divide(2);
      expect(result.toNumber()).toBe(5);
    });

    it('should floor divide when result is not whole', () => {
      const q = Quantity.of(10);
      const result = q.divide(3);
      expect(result.toNumber()).toBe(3);
    });

    it('should throw when dividing by zero or negative', () => {
      const q = Quantity.of(10);
      expect(() => q.divide(0)).toThrow(InvalidQuantityException);
      expect(() => q.divide(-1)).toThrow(InvalidQuantityException);
    });

    it('should calculate percentage', () => {
      const q = Quantity.of(100);
      const result = q.percentage(10);
      expect(result.toNumber()).toBe(10);
    });
  });

  describe('Convenience Methods', () => {
    it('should increase quantity', () => {
      const q = Quantity.of(10);
      const add = Quantity.of(5);
      const result = q.increase(add);
      expect(result.toNumber()).toBe(15);
    });

    it('should decrease quantity', () => {
      const q = Quantity.of(10);
      const sub = Quantity.of(3);
      const result = q.decrease(sub);
      expect(result.toNumber()).toBe(7);
    });
  });

  describe('Comparison', () => {
    it('should check if greater than', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(5);
      expect(q1.isGreaterThan(q2)).toBe(true);
      expect(q2.isGreaterThan(q1)).toBe(false);
    });

    it('should check if greater than or equal', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(10);
      expect(q1.isGreaterThanOrEqual(q2)).toBe(true);
    });

    it('should check if less than', () => {
      const q1 = Quantity.of(5);
      const q2 = Quantity.of(10);
      expect(q1.isLessThan(q2)).toBe(true);
    });

    it('should check if less than or equal', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(10);
      expect(q1.isLessThanOrEqual(q2)).toBe(true);
    });

    it('should check if zero', () => {
      expect(Quantity.zero().isZero()).toBe(true);
      expect(Quantity.of(10).isZero()).toBe(false);
    });

    it('should check if positive', () => {
      expect(Quantity.of(10).isPositive()).toBe(true);
      expect(Quantity.zero().isPositive()).toBe(false);
    });
  });

  describe('Has Enough For', () => {
    it('should return true when has enough stock', () => {
      const stock = Quantity.of(10);
      const required = Quantity.of(5);
      expect(stock.hasEnoughFor(required)).toBe(true);
    });

    it('should return true when has exact amount', () => {
      const stock = Quantity.of(10);
      const required = Quantity.of(10);
      expect(stock.hasEnoughFor(required)).toBe(true);
    });

    it('should return false when not enough', () => {
      const stock = Quantity.of(5);
      const required = Quantity.of(10);
      expect(stock.hasEnoughFor(required)).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal when values are the same', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(10);
      expect(q1.equals(q2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(5);
      expect(q1.equals(q2)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      const q = Quantity.of(10);
      expect(q.equals(null as any)).toBe(false);
      expect(q.equals(undefined as any)).toBe(false);
    });
  });

  describe('Formatting', () => {
    it('should convert to number', () => {
      const q = Quantity.of(42);
      expect(q.toNumber()).toBe(42);
    });

    it('should convert to string', () => {
      const q = Quantity.of(42);
      expect(q.toString()).toBe('42');
    });

    it('should convert to JSON', () => {
      const q = Quantity.of(42);
      expect(q.toJSON()).toBe(42);
    });
  });

  describe('Immutability', () => {
    it('should return new instances from arithmetic operations', () => {
      const q1 = Quantity.of(10);
      const q2 = Quantity.of(5);
      const result = q1.add(q2);

      // Original should be unchanged
      expect(q1.toNumber()).toBe(10);
      expect(q2.toNumber()).toBe(5);

      // Result should be new instance
      expect(result.toNumber()).toBe(15);
      expect(result).not.toBe(q1);
      expect(result).not.toBe(q2);
    });
  });
});
